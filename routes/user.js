const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const _ = require('lodash')
const db = require('../db')

const { userValidation } = require('../validation')

const router = express.Router()

// 注册
router.post('/signUp', async (req, res) => {
  const { error } = userValidation.register(req.body)
  if (error) {
    return res.json({ status: 1, message: error.details[0].message })
  }

  const { username, password } = req.body

  const users = await db.User.find({ username })
  if (users.length) {
    return res.json({
      status: 1,
      message: '用户名已存在！',
      data: null
    })
  }

  const user = new db.User({
    username,
    password: bcrypt.hashSync(password, 8)
  })

  try {
    await user.save()
    res.json({ status: 0, message: 'success', data: null })
  } catch (err) {
    console.log(err)
    res.json({ status: 1, message: err.message, data: null })
  }
})

// 登录
router.post('/signIn', async (req, res) => {
  const { error } = userValidation.login(req.body)
  if (error) {
    return res.json({ status: 1, message: error.details[0].message })
  }
  const { username, password } = req.body
  console.log(username, password)

  try {
    const user = await db.User.findOne({ username })
    if (!user) {
      return res.json({
        status: 1,
        message: '用户名或密码错误',
        data: null
      })
    }

    const isMatch = bcrypt.compareSync(password, user.password)
    if (!isMatch) {
      res.json({ status: 1, message: '用户名或密码错误' })
    } else {
      const token =
        'Bearer ' +
        jwt.sign({ userId: user.userId }, process.env.SECRET, {
          expiresIn: 60 * 60 * 24
        })
      res.json({
        status: 0,
        message: 'success',
        data: { token, userInfo: _.omit(user.toObject(), ['password']) }
      })
    }
  } catch (err) {
    console.log(err)
    res.json({ status: 1, message: 'Internal Error', data: null })
  }
})

// 新增地址
router.post('/addAddress', async (req, res) => {
  const { userId } = req.user
  const addressInfo = req.body

  const r = await db.Address.findOneAndUpdate(
    { userId },
    {
      $push: {
        addressList: {
          $each: [addressInfo]
        }
      }
    },
    { upsert: true }
  )
  console.log(r)
  res.json({
    status: 0,
    message: 'success',
    data: r
  })
})

// 获取收货地址列表
router.get('/addressList', async (req, res) => {
  const { userId } = req.user
  const data = await db.Address.aggregate([
    { $match: { userId } },
    {
      $project: {
        addressList: 1,
        _id: 0
      }
    }
  ])
  res.json({
    status: 0,
    message: 'success',
    data
  })
})

// 删除收货地址
router.delete('/address/:addressId', async (req, res) => {
  const { userId } = req.user
  const { addressId } = req.params
  const data = await db.Address.findOneAndUpdate(
    {
      userId
    },
    {
      $pull: {
        addressList: {
          addressId
        }
      }
    },
    { new: true }
  )

  res.json({
    status: 0,
    message: 'success',
    data: _.omit(data.toObject(), ['userId', '_id', '_v'])
  })
})

// 修改地址
router.post('/address/:addressId', async (req, res) => {
  const { userId } = req.user
  const { addressId } = req.params
  const update = req.body

  console.log(addressId)
  console.log(update)

  const data = await db.Address.findOneAndUpdate(
    {
      userId,
      'addressList.addressId': addressId
    },
    {
      'addressList.$': update
    },
    {
      new: true
    }
  )

  res.json({
    status: 0,
    message: 'success',
    data: _.omit(data.toObject(), ['userId', '_id', '_v'])
  })
})

module.exports = router
