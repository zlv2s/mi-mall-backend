const express = require('express')
const _ = require('lodash')
const db = require('../db')
const spider = require('../spider')
const utils = require('../utils')

const router = express.Router()

// 预生成订单信息
router.post('/checkout', async (req, res) => {
  const { userId } = req.user
  const { action } = req.body
  if (action === 'checkout') {
    const data = await spider.getCheckedItems(userId)
    const r = await db.Order.findOneAndUpdate({ userId }, data, {
      upsert: true
    })
    console.log(r)
    res.json({
      status: 0,
      message: 'success',
      data: null
    })
  }
})

// 订单确认
router.post('/confirm', async (req, res) => {
  const { userId } = req.user
  const { action } = req.body

  console.log(action)

  if (action === 'confirm') {
    const data = await db.Order.findOneAndDelete({ userId })
    const r = await db.ConfirmOrder.findOneAndUpdate({ userId }, data, {
      upsert: true,
      new: true
    })
    console.log(r)
    res.json({
      status: 0,
      message: 'success',
      data: r
    })
  } else {
    res.json({
      status: 1,
      message: 'failed',
      data: null
    })
  }
})

// 选择收货地址
router.post('/setAddress', async (req, res) => {
  const { userId } = req.user
  const { addressId } = req.body
  await db.Order.findOneAndUpdate({ userId }, { addressId })
  res.json({
    status: 0,
    message: 'success',
    data: null
  })
})

module.exports = router
