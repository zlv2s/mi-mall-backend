const express = require('express')
require('dotenv').config()
const morgan = require('morgan')
const cors = require('cors')
const expressJwt = require('express-jwt')

const userRoute = require('./routes/user')
const productRoute = require('./routes/product')
const cartRoute = require('./routes/cart')
const orderRoute = require('./routes/order')

const PORT = process.env.PORT || 3030
const app = express()

app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// app.use(
//   cors({
//     origin: ['http://10.7.183.60:8999', 'http://localhost:8999']
//   })
// )

app.use(cors())

app.use(
  expressJwt({
    secret: process.env.SECRET,
    algorithms: ['HS256']
  }).unless({
    path: [
      '/api/mi-mall/user/signIn',
      '/api/mi-mall/user/signUp',
      { url: /^\/api\/mi-mall\/product\/\w+/, methods: ['GET'] }
    ]
  })
)

app.use('/api/mi-mall/product', productRoute)
app.use('/api/mi-mall/user', userRoute)
app.use('/api/mi-mall/cart', cartRoute)
app.use('/api/mi-mall/order', orderRoute)

app.use(function (err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    res.status(401).json({ message: 'Unauthorized access' })
  }
})

app.listen(PORT, () => {
  console.log(`App is listening on port: ${PORT}`)
})
