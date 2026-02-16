import { Client } from 'pg'
import fs from 'fs'
import path from 'path'

export const initializeDb = async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  })

  try {
    await client.connect()
    // Path to your SQL file
    const sqlFile = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8')

    // Execute the SQL queries
    await client.query(sqlFile)
    console.log('Database initialized successfully')
  } catch (err) {
    console.error('Initialization failed:', err)
  } finally {
    await client.end()
  }
}
