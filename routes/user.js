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

module.exports = router
