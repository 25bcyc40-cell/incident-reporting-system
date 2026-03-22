import express from 'express'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import cors from 'cors'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const app = express()
const PORT = process.env.PORT || 4000
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key'

app.use(cors())
app.use(express.json())
app.use(express.static('client'))

// Database initialization
const initDb = async () => {
  const db = await open({
    filename: './server/db.sqlite',
    driver: sqlite3.Database,
  })

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user'
    );

    CREATE TABLE IF NOT EXISTS incidents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Open',
      created_by INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(created_by) REFERENCES users(id)
    );
  `)

  // seed admin user
  const adminUser = await db.get('SELECT * FROM users WHERE email = ?', 'admin@example.com')
  if (!adminUser) {
    const hashed = await bcrypt.hash('adminpass', 10)
    await db.run('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', 'admin@example.com', hashed, 'admin')
    console.log('Seeded admin user: admin@example.com / adminpass')
  }

  return db
}

const dbPromise = initDb()

// Auth helpers
const signToken = (user) => {
  return jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '8h' })
}

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Token required' })

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.user = payload
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

const isAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}

// Routes
app.post('/api/signup', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  const db = await dbPromise
  const existing = await db.get('SELECT * FROM users WHERE email = ?', email)
  if (existing) return res.status(409).json({ error: 'Email already registered' })

  const hashed = await bcrypt.hash(password, 10)
  const result = await db.run('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', email, hashed, 'user')
  const user = { id: result.lastID, email, role: 'user' }

  const token = signToken(user)
  res.json({ user, token })
})

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' })

  const db = await dbPromise
  const user = await db.get('SELECT * FROM users WHERE email = ?', email)
  if (!user) return res.status(401).json({ error: 'Invalid credentials' })

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

  const token = signToken({ id: user.id, email: user.email, role: user.role })
  res.json({ user: { id: user.id, email: user.email, role: user.role }, token })
})

app.get('/api/incidents', authenticateToken, async (req, res) => {
  const db = await dbPromise
  if (req.user.role === 'admin') {
    const incidents = await db.all('SELECT * FROM incidents ORDER BY created_at DESC')
    return res.json({ incidents })
  }

  const incidents = await db.all('SELECT * FROM incidents WHERE created_by = ? ORDER BY created_at DESC', req.user.id)
  res.json({ incidents })
})

app.post('/api/incidents', authenticateToken, async (req, res) => {
  const { title, description } = req.body
  if (!title || !description) return res.status(400).json({ error: 'Title and description are required' })

  const db = await dbPromise
  const created_at = new Date().toISOString()
  const result = await db.run(
    'INSERT INTO incidents (title, description, status, created_by, created_at) VALUES (?, ?, ?, ?, ?)',
    title,
    description,
    'Open',
    req.user.id,
    created_at
  )

  const incident = await db.get('SELECT * FROM incidents WHERE id = ?', result.lastID)
  res.status(201).json({ incident })
})

app.put('/api/incidents/:id', authenticateToken, async (req, res) => {
  const { id } = req.params
  const { title, description, status } = req.body

  if (!title && !description && !status) {
    return res.status(400).json({ error: 'At least one field must be provided' })
  }

  const db = await dbPromise
  const incident = await db.get('SELECT * FROM incidents WHERE id = ?', id)
  if (!incident) return res.status(404).json({ error: 'Incident not found' })

  if (req.user.role !== 'admin' && incident.created_by !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized to edit this incident' })
  }

  const updated = {
    title: title || incident.title,
    description: description || incident.description,
    status: status || incident.status,
  }

  await db.run('UPDATE incidents SET title = ?, description = ?, status = ? WHERE id = ?', updated.title, updated.description, updated.status, id)
  const changed = await db.get('SELECT * FROM incidents WHERE id = ?', id)
  res.json({ incident: changed })
})

app.delete('/api/incidents/:id', authenticateToken, async (req, res) => {
  const { id } = req.params
  const db = await dbPromise
  const incident = await db.get('SELECT * FROM incidents WHERE id = ?', id)
  if (!incident) return res.status(404).json({ error: 'Incident not found' })

  if (req.user.role !== 'admin' && incident.created_by !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized to delete this incident' })
  }

  await db.run('DELETE FROM incidents WHERE id = ?', id)
  res.json({ message: 'Deleted' })
})

app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
  const db = await dbPromise
  const users = await db.all('SELECT id, email, role FROM users')
  res.json({ users })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
