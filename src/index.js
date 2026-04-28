import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import routes from './routes/index.js'
import rateLimit from 'express-rate-limit'

const app = express()
const PORT = process.env.PORT || 3000

app.set('trust proxy', 1)

// ── Middleware ───────────────────────────────────
app.use(cors())
app.use(express.json())

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later'
})
app.use(limiter)

// ── Routes ───────────────────────────────────────
app.use('/api', routes)

// ── Health check ─────────────────────────────────
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' })
})

// ── 404 handler ──────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' })
})

// ── Global error handler ─────────────────────────
app.use((err, req, res, next) => {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})