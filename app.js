const express = require('express')
require('dotenv').config()
const morgan = require('morgan')
const cors = require('cors')
const expressJwt = require('express-jwt')

const userRoute = require('./routes/user')
const productRoute = require('./routes/product')

const PORT = process.env.PORT || 3030
const app = express()

app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

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

app.use(function (err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    res.status(401).json({ message: 'Unauthorized access' })
  }
})

app.listen(PORT, () => {
  console.log(`App is listening on port: ${PORT}`)
})
