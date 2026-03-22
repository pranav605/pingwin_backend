import { supabaseAdmin } from '../config/supabase.js'

// POST /api/tokens/upsert
// Called by the app on login or when the push token changes
export async function upsertToken(req, res) {
    const { token } = req.body
    const userId = req.userId

    if (!token) {
        return res.status(400).json({ error: 'token is required' })
    }

    const { error } = await supabaseAdmin
        .from('push_tokens')
        .upsert(
            { user_id: userId, token },
            { onConflict: 'token' }   // if token already exists, update user_id
        )

    if (error) {
        return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ message: 'Token registered' })
}