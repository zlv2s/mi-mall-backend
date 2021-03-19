const express = require('express')
const _ = require('lodash')
const db = require('../db')
const spider = require('../spider')

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
        console.log(111, goods)
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

// 删除商品
router.post('/delete/:goodsId', async (req, res) => {
  // todo
})

// 获取购物车商品信息
router.get('/getList', async (req, res) => {
  const { userId } = req.user

  const { goodsList } = await db.Cart.findOne({ userId })

  const cartList = await spider.getCartItems(goodsList)

  console.log(cartList)

  res.json({
    status: 0,
    message: 'success',
    data: cartList
  })
})

module.exports = router
