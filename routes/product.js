const express = require('express')
const router = express.Router()
const spider = require('../spider')

// 获取首页商品
router.get('/all', async (req, res) => {
  const data = await spider.getHomeData()
  return res.json({
    status: 0,
    message: 'success',
    data
  })
})

// 获取首页分类列表数据

router.get('/catList', async (req, res) => {
  const data = await spider.getCatList()
  return res.json({
    status: 0,
    message: 'success',
    data
  })
})

// 获取商品详情
router.get('/:productId', async (req, res) => {
  const { productId } = req.params
  const data = await spider.getProductDetail(productId)
  return res.json({
    status: 0,
    message: 'success',
    data
  })
})

module.exports = router
