import { supabaseAdmin } from '../config/supabase.js'

export async function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or malformed token' })
    }

    const token = authHeader.split(' ')[1]

    const { data, error } = await supabaseAdmin.auth.getUser(token)

    if (error || !data?.user) {
        return res.status(401).json({ error: 'Invalid token' })
    }

    req.userId = data.user.id
    next()
}