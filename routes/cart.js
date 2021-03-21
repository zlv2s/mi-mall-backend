const express = require('express')
const _ = require('lodash')
const db = require('../db')
const spider = require('../spider')
const utils = require('../utils')

const router = express.Router()

// 新增商品id
router.post('/add', async (req, res) => {
  const { goodsId } = req.body
  const { userId } = req.user

  try {
    const cart = await db.Cart.findOne({ userId }).exec()
    if (!cart) {
      console.log('create new')
      await new db.Cart({ userId, goodsList: [{ goodsId, num: 1 }] }).save()
    } else {
      const goods = cart.goodsList.find(item => item.goodsId === goodsId)
      if (goods) {
        goods.num += 1
        cart.markModified('goodsList')
        await cart.save()
      } else {
        cart.goodsList.push({ goodsId, num: 1 })
        await cart.save()
      }
    }
    res.json({ status: 0, message: 'success', data: null })
  } catch (error) {
    res.json({ status: 0, message: 'internal error occured', data: null })
  }
})

// 更新商品
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

// 获取购物车商品信息
router.get('/getList', async (req, res) => {
  const { userId } = req.user

  const cartList = await spider.getCartItems(userId)

  res.json({
    status: 0,
    message: 'success',
    data: cartList
  })
})

// 获取购物车推荐列表
router.get('/recom/:cid', async (req, res) => {
  const { cid } = req.params

  const data = await spider.getCartRec(111)
  res.json({
    status: 0,
    message: 'success',
    data
  })
})

module.exports = router
