import { Expo } from 'expo-server-sdk'
import { supabaseAdmin } from '../config/supabase.js'

const expo = new Expo()

// POST /api/notify
// Public endpoint — authenticated via API key, not JWT
// Called by the user's external applications
export async function notify(req, res) {
    const { api_key, title, body } = req.body

    if (!api_key || !title || !body) {
        return res.status(400).json({ error: 'api_key, title, and body are required' })
    }

    // 1. Validate API key and get the project + owner
    const { data: project, error: projectError } = await supabaseAdmin
        .from('projects')
        .select('id, user_id, is_active')
        .eq('api_key', api_key)
        .single()

    if (projectError || !project) {
        return res.status(401).json({ error: 'Invalid API key' })
    }

    if (!project.is_active) {
        return res.status(403).json({ error: 'Project is inactive' })
    }

    // 2. Look up all push tokens for the project owner
    const { data: tokenRows, error: tokenError } = await supabaseAdmin
        .from('push_tokens')
        .select('token')
        .eq('user_id', project.user_id)

    if (tokenError || !tokenRows.length) {
        return res.status(404).json({ error: 'No push tokens found for this user' })
    }

    // 3. Build Expo messages for each device token
    const messages = tokenRows
        .filter(row => Expo.isExpoPushToken(row.token))
        .map(row => ({
            to: row.token,
            title,
            body,
            sound: 'default',
        }))

    if (!messages.length) {
        return res.status(400).json({ error: 'No valid Expo push tokens found' })
    }

    // 4. Send via Expo in chunks (Expo recommends batching)
    let status = 'sent'
    try {
        const chunks = expo.chunkPushNotifications(messages)
        for (const chunk of chunks) {
            await expo.sendPushNotificationsAsync(chunk)
        }
    } catch (err) {
        status = 'failed'
        console.error('Expo push error:', err)
    }

    // 5. Log the notification to the database
    await supabaseAdmin
        .from('notifications')
        .insert({
            project_id: project.id,
            title,
            body,
            status,
        })

    if (status === 'failed') {
        return res.status(500).json({ error: 'Failed to send notification' })
    }

    return res.status(200).json({ message: 'Notification sent' })
}