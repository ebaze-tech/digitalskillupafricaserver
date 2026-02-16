import { pool } from './config/db.config'
import fs from 'fs'
import path from 'path'

export const initializeDb = async () => {
  try {
    const sqlFile = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')

    await pool.query(sqlFile)
    console.log('Database initialized successfully')
  } catch (err) {
    console.error('Initialization failed:', err)
    throw err
  }
}
