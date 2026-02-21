const jwt = require('jsonwebtoken')
const { createHash } = require('crypto')

const hashToken = token => {
  return createHash('sha256').update(token).digest('hex')
}

const generateAccessToken = user => {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m'
  })
}

const generateRefreshToken = user => {
  return jwt.sign(
    { id: user.id, tokenType: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' }
  )
}

module.exports = { hashToken, generateAccessToken, generateRefreshToken }
