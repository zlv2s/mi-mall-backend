const express = require('express')
const _ = require('lodash')
const db = require('../db')
const spider = require('../spider')
const { randomNumber } = require('../utils')

const router = express.Router()

// 预生成订单信息
router.post('/checkout', async (req, res) => {
  const { userId } = req.user
  const { action } = req.body

  const key = ('' + Math.random().toFixed(6)).replace('0.', '')
  if (action === 'checkout') {
    const data = await spider.getCheckedItems(userId)
    const r = await db.Order.findOneAndUpdate(
      { userId },
      {
        $push: {
          pOrderList: { $each: [{ ...data, key }] }
        }
      },
      {
        upsert: true,
        new: true
      }
    )
    res.json({
      status: 0,
      message: 'success',
      data: _.pick(
        r.pOrderList.map(o => o.toObject()).filter(o => o.key === key)[0],
        ['pOid']
      )
    })
  }
})

// 订单确认
router.post('/confirm', async (req, res) => {
  const { userId } = req.user
  const { action, pOid } = req.body

  console.log(action, pOid)

  if (action === 'confirm') {
    const data = await db.Order.findOne(
      {
        userId,
        'pOrderList.pOid': pOid
      },
      {
        'pOrderList.$': 1,
        _id: 0
      }
    )

    const { addressId } = data.toObject().pOrderList[0]

    if (!addressId) {
      return res.json({
        status: 1,
        message: '请选择收货地址！',
        data: null
      })
    }
    await db.Order.findOneAndUpdate(
      {
        userId,
        'pOrderList.pOid': pOid
      },
      {
        $pull: {
          pOrderList: {
            pOid
          }
        }
      }
    )

    let r = await db.ConfirmOrder.findOneAndUpdate(
      { userId },
      {
        $push: {
          cOrderList: {
            $each: [data.toObject().pOrderList[0]]
          }
        }
      },
      {
        upsert: true,
        new: true
      }
    )

    r = r.cOrderList.map(x => x.toObject()).filter(x => x.pOid === pOid)[0]

    res.json({
      status: 0,
      message: 'success',
      data: _.pick(r, ['cOid'])
    })
  } else {
    res.json({
      status: 1,
      message: 'failed',
      data: null
    })
  }
})

// 获取订单详情
router.get('/:cOid', async (req, res) => {
  const { userId } = req.user
  const { cOid } = req.params
  let r = await db.ConfirmOrder.findOne(
    {
      userId,
      'cOrderList.cOid': cOid
    },
    {
      'cOrderList.$': 1,
      _id: 0
    }
  )
  r = r.cOrderList.map(x => x.toObject()).filter(x => x.cOid === cOid)[0]
  const { addressId } = r
  const address = await db.Address.findOne(
    {
      userId,
      'addressList.addressId': addressId
    },
    {
      'addressList.$': 1,
      _id: 0
    }
  )

  res.json({
    status: 0,
    message: 'success',
    data: {
      orderInfo: {
        ...r,
        address: address.addressList[0],
        orderId: randomNumber()
      }
    }
  })
})

// 选择收货地址
router.post('/setAddress', async (req, res) => {
  const { userId } = req.user
  const { pOid, addressId } = req.body
  await db.Order.findOneAndUpdate(
    { userId, 'pOrderList.pOid': pOid },
    { 'pOrderList.$.addressId': addressId }
  )
  res.json({
    status: 0,
    message: 'success',
    data: null
  })
})

module.exports = router
