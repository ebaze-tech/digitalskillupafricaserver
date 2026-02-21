import express, { type Router as RouterType } from 'express'
import { getAuthenticatedUser } from '../middlewares/auth.middleware'
import { dropDb } from '../initDB'
import { authenticateUser } from '../middlewares/userauth.middleware'

export const dbRouter: RouterType = express.Router()

if (process.env.NODE_ENV !== 'production') {
  dbRouter.post(
    '/drop-db',
    authenticateUser,
    (req, res, next) => {
      console.log(req.user?.role)
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' })
      }
      next()
    },
    async (req, res) => {
      try {
        await dropDb()
        res.status(200).json({ message: 'Database cleared successfully' })
      } catch (error) {
        console.error('Drop DB error:', error)
        res.status(500).json({ error: 'Failed to clear database' })
      }
    }
  )
}
