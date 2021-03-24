const express = require('express')
const _ = require('lodash')
const db = require('../db')
const spider = require('../spider')
const utils = require('../utils')

const router = express.Router()

// 新增商品id
router.post('/add', async (req, res) => {
  const { goodsId, productId } = req.body
  const { userId } = req.user

  console.log(`add - gid:${goodsId}, pid:${productId}`)

  spider.checkIfProductExist(productId)

  try {
    const cart = await db.Cart.findOne({ userId }).exec()
    // 第一次添加购物车
    if (!cart) {
      console.log('create new')
      await new db.Cart({ userId, goodsList: [{ goodsId, num: 1 }] }).save()
    } else {
      // 根据 gid 查找
      const goods = cart.goodsList.find(item => item.goodsId === goodsId)
      if (goods) {
        // 如果存在，数量加1
        goods.num += 1
        cart.markModified('goodsList')
        await cart.save()
      } else {
        // 不存在，添加
        cart.goodsList.push({ goodsId, num: 1 })
        await cart.save()
      }
    }
    res.json({ status: 0, message: 'success', data: null })
  } catch (error) {
    console.log(error)
    res.json({ status: 0, message: 'internal error occured', data: null })
  }
})

// 更新购物车商品 - 数量，是否选中
router.post('/update/:goodsId', async (req, res) => {
  const { goodsId } = req.params
  const { userId } = req.user
  const update = req.body
  const { isCheckedAll, num, isChecked } = update
  console.log(goodsId, update)
  if (utils.checkType(isCheckedAll) === 'Boolean' && goodsId === 'all') {
    const r = await db.Cart.findOneAndUpdate(
      { userId },
      {
        $set: { 'goodsList.$[].isChecked': isCheckedAll }
      },
      {
        new: true
      }
    )
  }

  if (utils.checkType(isChecked) === 'Boolean') {
    const r = await db.Cart.findOneAndUpdate(
      { userId, 'goodsList.goodsId': goodsId },
      {
        $set: { 'goodsList.$.isChecked': isChecked }
      },
      {
        new: true
      }
    )
  }

  if (utils.checkType(num) === 'Number') {
    const r = await db.Cart.findOneAndUpdate(
      {
        userId,
        'goodsList.goodsId': goodsId
      },
      {
        $inc: { 'goodsList.$.num': num }
      },
      {
        new: true
      }
    )

    await db.Cart.findOneAndUpdate(
      {
        userId,
        goodsList: {
          $elemMatch: {
            goodsId: { $eq: goodsId },
            num: { $lte: 1 }
          }
        }
      },
      {
        'goodsList.$.num': 1
      }
    )

    await db.Cart.findOneAndUpdate(
      {
        userId,
        goodsList: {
          $elemMatch: {
            goodsId: { $eq: goodsId },
            num: { $gte: 5 }
          }
        }
      },
      {
        'goodsList.$.num': 5
      }
    )
  }

  res.json({
    status: 0,
    message: 'success',
    data: null
  })
})

// 删除商品
router.delete('/delete/:goodsId', async (req, res) => {
  const { goodsId } = req.params
  const { userId } = req.user
  const r = await db.Cart.findOneAndUpdate(
    {
      userId
    },
    {
      $pull: {
        goodsList: {
          goodsId
        }
      }
    }
  )
  res.json({
    status: 0,
    message: 'success',
    data: null
  })
})

// 获取购物车商品列表
router.get('/getList', async (req, res) => {
  const { userId } = req.user

  const cartList = await spider.getCartItems(userId)

  res.json({
    status: 0,
    message: 'success',
    data: cartList
  })
})

// 获取购物车单件商品相关推荐列表
router.get('/recom/:cid', async (req, res) => {
  const { cid } = req.params

  const data = await spider.getCartRec(cid)
  res.json({
    status: 0,
    message: 'success',
    data
  })
})

// 根据 gid 获取商品部分字段
router.get('/getItem/:gid', async (req, res) => {
  const { userId } = req.user
  const { gid } = req.params

  const doc = await db.Cart.findOne({
    userId,
    'goodsList.goodsId': {
      $eq: gid
    }
  })

  if (doc) {
    const item = await db.Product.aggregate([
      { $match: { goods_id: parseFloat(gid) } },
      {
        $project: {
          name: 1,
          commodity_id: 1
        }
      }
    ])

    res.json({
      status: 0,
      message: 'success',
      data: item
    })
  } else {
    res.json({
      status: 1,
      message: 'error',
      data: '该件商品没有添加到购物车'
    })
  }
})

// 获取选中商品信息
router.get('/getCheckout/:pOid', async (req, res) => {
  const { userId } = req.user
  const { pOid } = req.params
  // const data = await spider.getCheckedItems(userId)
  // await db.Order.findOneAndUpdate({ userId }, data, { upsert: true })
  const data = await db.Order.findOne(
    { userId, 'pOrderList.pOid': pOid },
    {
      'pOrderList.$': 1,
      _id: 0
    }
  )
  res.json({
    status: 0,
    message: 'success',
    data
  })
})

// 搜索区域信息
router.get('/searchAddress', async (req, res) => {
  const query = req.query
  console.log(query)

  const addInfo = await spider.getAddress(query.keywords)

  res.json({
    status: 0,
    message: 'success',
    data: addInfo
  })
})

// 获取街道信息
router.get('/getAreaInfo', async (req, res) => {
  const { adcode, location } = req.query

  const addInfo = await spider.getAreaInfo({ adcode, location })

  res.json({
    status: 0,
    message: 'success',
    data: addInfo
  })
})

module.exports = router
