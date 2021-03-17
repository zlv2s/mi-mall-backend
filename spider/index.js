const axios = require('axios')
const cheerio = require('cheerio')

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
      this.getFloorData()
    ]).then(res => {
      const [swiperList, flashSlideList, promoList, goodsFloorData] = res
      return { swiperList, flashSlideList, promoList, goodsFloorData }
    })
  }

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

  async getFloorData() {
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

  async getCatList() {
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

  async getPromoList() {
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

  async getProductDetail(id) {
    console.log(id)
    const url = `https://api2.order.mi.com/product/view?product_id=${id}&version=2&t=${parseInt(
      Date.now() / 1000
    )}`

    return axios({
      url,
      headers: {
        origin: 'https://www.mi.com',
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36',
        referer: 'https://www.mi.com/'
      }
    }).then(res => {
      return res.data
    })
  }
}

module.exports = new Mimall()
