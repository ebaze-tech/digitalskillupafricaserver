import express, { Application, Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { pool } from './config/db.config'
// import { modelAssociations } from "./models/models.assocation/models.assocation";

import { router as authRoutes } from './routes/auth.routes'
import { router as profileRoutes } from './routes/profile.routes'
import { router as mentorRoutes } from './routes/mentorship.routes'
import { router as adminRoutes } from './routes/admin.routes'
import { dropDb, initializeDb } from './initDB'
import { getAuthenticatedUser } from './middlewares/auth.middleware'
import { dbRouter } from './routes/db.route'

// Initialize environment variables
dotenv.config()

// Setup
export const app: Application = express()
const PORT = process.env.PORT
const allowedOrigins = [
  process.env.CLIENT_URL
  //  ['https://digitalskillupafrica.vercel.app']
]

// Middleware
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true
  })
)
app.use(express.json())

// Routes
app.use('/auth', authRoutes)
app.use('/users', profileRoutes)
app.use('/mentorship', mentorRoutes)
app.use('/admin', adminRoutes)
app.use('/manage', dbRouter)
// Health check
app.get('/', (req: Request, res: Response) => {
  res.send('Server is running')
})

export const startServer = async () => {
  try {
    await initializeDb()
    await pool.connect()
    // await dropDb()

    console.log('Connected to DB')

    // modelAssociations();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()
