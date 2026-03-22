import jwt from 'jsonwebtoken'
import 'dotenv/config'

export function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or malformed token' })
    }

    const token = authHeader.split(' ')[1]

    try {
        const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET)
        req.userId = decoded.sub  // Supabase stores the user UUID in the 'sub' field
        next()
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' })
    }
}