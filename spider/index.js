const axios = require('axios')
const cheerio = require('cheerio')
const db = require('../db')
const _ = require('lodash')

class Mimall {
  constructor() {
    this.$home = null
    this.init()
  }

  async init() {
    this.$home = await this.getHomePage()
  }

  async getHomeData() {
    return Promise.all([
      this.getSlideList(),
      this.getSubSlideList(),
      this.getPromoList(),
      this.getFloorData(),
      this.getChannelList()
    ]).then(res => {
      const [
        swiperList,
        flashSlideList,
        promoList,
        goodsFloorData,
        channelList
      ] = res

      return {
        swiperList,
        flashSlideList,
        promoList,
        goodsFloorData,
        channelList
      }
    })
  }

  // 秒杀轮播图数据
  async getFlashSlide() {
    const url =
      'https://api2.order.mi.com/flashsale/getslideshow?callback=__jp0'
    return axios
      .get(url, {
        headers: {
          referer: 'https://www.mi.com/',
          'user-agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36'
        }
      })
      .then(res => res.data)
  }

  async getHomePage() {
    const url = 'https://www.mi.com/'

    const { data } = await axios.get(url, {
      headers: {
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36'
      }
    })
    return cheerio.load(data)
  }

  async getSubSlideList() {
    let res = await this.getFlashSlide()
    res = res.match(/(?<=\_\_jp0\()(.*)(?=\);)/gs)[0]
    return JSON.parse(res).data.list.list
  }

  async getSlideList() {
    const $ = this.$home
    const swiperList = []
    $('.swiper-slide').each((i, ele) => {
      const imgUrl =
        $(ele).find('img').attr('src') || $(ele).find('img').attr('data-src')
      const link = $(ele).children().attr('href')
      swiperList.push({
        imgUrl,
        link
      })
    })

    return swiperList
  }

  getChannelList() {
    const $ = this.$home
    const channelList = []
    $('.home-channel-list li').each((i, ele) => {
      const imgUrl = $(ele).find('a img').attr('src')
      const value = $(ele).find('a').text().trim()
      const link = $(ele)
        .find('a')
        .attr('href')
        .replace(/(https?:)?(.*)/, (_, $1, $2) => ($1 ? $1 + $2 : 'https' + $2))
      channelList.push({
        imgUrl,
        link,
        value
      })
    })

    return channelList
  }

  getFloorData() {
    const $ = this.$home
    let dataObj
    $('script:not([src])').each((i, ele) => {
      let str = $(ele).html().toString()
      if (str.includes('goodsFloorData')) {
        str = str.replace('var $GLOBAL_HOME', 'dataObj')
        eval(str)
      }
    })

    return dataObj.goodsFloorData
  }

  getCatList() {
    const $ = this.$home
    const categoryList = []
    $('.category-item').each((i, ele) => {
      const categoryName = $(ele).find('a.title').text().trim()
      const categoryLink = $(ele).find('a.title').attr('href')
      const categoryItem = {
        title: categoryName,
        link: categoryLink,
        children: []
      }

      $(ele)
        .find('.children-list li')
        .each((idx, li) => {
          categoryItem.children.push({
            link: $(li).find('a.link').attr('href'),
            imgUrl: $(li).find('img.thumb').attr('data-src'),
            goodsName: $(li).find('a').text().trim()
          })
        })

      categoryList.push(categoryItem)
    })

    return categoryList
  }

  getPromoList() {
    const $ = this.$home
    const promoList = []
    $('.home-promo-list li').each((i, ele) => {
      promoList.push({
        link: $(ele).find('a').attr('href'),
        imgUrl: $(ele).find('img').attr('src')
      })
    })

    return promoList
  }

  saveProducts(list) {
    list = list.map(x => x.goods_info)
    db.Product.find({}).then(res => {
      const diff = list.filter(o1 => {
        if (!res.length) return true
        return !res
          .map(x => x.toObject()) //数据库查出来的是文档类型，转换为对象
          .some(o2 => {
            // console.log(o2.goods_id, typeof o2.goods_id)
            return o2.goods_id === o1.goods_id
          })
      })
      console.log(`diff length: ${diff.length}`)
      diff.length && db.Product.insertMany(diff)
    })
  }

  getProductDetail(id) {
    const url = `https://api2.order.mi.com/product/view?product_id=${id}&version=2&t=${parseInt(
      Date.now() / 1000
    )}`

    const detail = axios({
      url,
      headers: {
        origin: 'https://www.mi.com',
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36',
        referer: 'https://www.mi.com/'
      }
    }).then(res => res.data.data)

    const nav = this.getDetailNav(id)

    return Promise.all([detail, nav]).then(res => {
      const [detailItem, navItem] = res

      this.saveProducts(detailItem.goods_list)

      const $ = cheerio.load(navItem)
      let dataObj
      $('script:not([src])').each((i, ele) => {
        let str = $(ele).html().toString()
        if (str.includes('GLOBAL_PAGE_INFO')) {
          str = str.replace('var $GLOBAL_PAGE_INFO', 'dataObj')
          eval(str)
        }
      })

      const { left, right } = dataObj

      return {
        detailItem,
        left,
        right
      }
    })
  }

  getDetailNav(id) {
    const url = `https://www.mi.com/buy/detail?product_id=${id}`
    return axios
      .get(url, {
        headers: {
          'user-agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36'
        }
      })
      .then(res => res.data)
  }

  getItem(item) {
    return db.Product.findOne({ goods_id: item.goodsId })
      .then(res => {
        const filtered = _.pick(res.toObject(), [
          'goods_id',
          'name',
          'price',
          'market_price',
          'img_url'
        ])

        return {
          ...filtered,
          isChecked: item.isChecked,
          num: item.num,
          totalPrice: item.num * parseFloat(filtered['price'])
        }
      })
      .catch(err => {
        console.log(err)
      })
  }

  async getCartItems(userId) {
    const { goodsList } = await db.Cart.findOne({ userId })
    return Promise.all(goodsList.map(item => this.getItem(item)))
  }
}

module.exports = new Mimall()
