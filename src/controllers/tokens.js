import { supabaseAdmin } from '../config/supabase.js'

// POST /api/tokens/upsert
export async function upsertToken(req, res) {
    const { token, device_id } = req.body
    const userId = req.userId

    if (!token || !device_id) {
        return res.status(400).json({ error: 'token and device_id are required' })
    }

    const { error } = await supabaseAdmin
        .from('push_tokens')
        .upsert(
            {
                user_id: userId,
                device_id,
                token,
                updated_at: new Date().toISOString()
            },
            {
                onConflict: 'user_id,device_id'
            }
        )

    if (error) {
        return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ message: 'Token registered' })
}