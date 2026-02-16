import { body, validationResult } from 'express-validator'
import { Request, Response, NextFunction } from 'express'

export const validateRegister = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('username').notEmpty().trim().escape(),
  body('role').isIn(['mentor', 'mentee', 'admin']),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    next()
  }
]
