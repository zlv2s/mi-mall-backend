const mongoose = require('./db')
const { uuid } = require('../utils')

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    default: uuid
  },
  username: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  created: {
    type: Number,
    default: Date.now
  },
  updated: {
    type: Number,
    default: 0
  }
})

module.exports = {
  User: mongoose.model('User', userSchema)
}
