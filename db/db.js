const mongoose = require('mongoose')

// 初次连接错误处理
mongoose
  .connect(process.env.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    dbName: process.env.DB_NAME
  })
  .catch(err => console.log(err.message))

// 初始连接之后错误处理
mongoose.connection.on('error', err => {
  console.log(err.message)
})

mongoose.connection.on('open', () =>
  console.log('mongodb successfully connected')
)

mongoose.set('useFindAndModify', false)

module.exports = mongoose
