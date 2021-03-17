const Joi = require('joi')

// User
const register = data => {
  const schema = Joi.object({
    username: Joi.string().alphanum().min(4).max(8).required(),
    password: Joi.string()
      .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$'))
      .min(6)
      .max(30)
  })

  return schema.validate(data)
}

const login = data => {
  const schema = Joi.object({
    username: Joi.string().alphanum().min(4).max(8).required(),
    password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$'))
  })

  return schema.validate(data)
}

module.exports.userValidation = { register, login }
