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

const cartSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  goodsList: [
    {
      goodsId: Number,
      num: Number,
      isChecked: {
        type: Boolean,
        default: true
      }
    }
  ]
  // cartList: [
  //   {
  //     goods_id: Number,
  //     name: String,
  //     price: String,
  //     market_price: String,
  //     img_url: String,
  //     isChecked: Boolean,
  //     num: Number,
  //     totalPrice: Number
  //   }
  // ]
})

const productSchema = new mongoose.Schema(
  {},
  { timestamps: true, strict: false }
)

const orderSchema = new mongoose.Schema({})

const addressSchema = new mongoose.Schema({
  userId: String,
  addressList: [
    {
      addressId: {
        type: String,
        default: uuid
      },
      address: String,
      address_id: String,
      address_info: String,
      area_id: Number,
      area_name: String,
      city_id: Number,
      city_name: String,
      consignee: String,
      district_id: Number,
      district_name: String,
      province_id: Number,
      province_name: String,
      tag_name: String,
      telephone: String,
      zipcode: String
    }
  ]
})

module.exports = {
  User: mongoose.model('User', userSchema),
  Cart: mongoose.model('Cart', cartSchema),
  Product: mongoose.model('Product', productSchema),
  Address: mongoose.model('Address', addressSchema)
}
