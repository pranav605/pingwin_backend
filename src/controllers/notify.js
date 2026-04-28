import { Expo } from 'expo-server-sdk'
import { supabaseAdmin } from '../config/supabase.js'

const expo = new Expo()

export async function notify(req, res) {
    const { api_key, title, body } = req.body

    if (!api_key || !title || !body) {
        return res.status(400).json({ error: 'api_key, title, and body are required' })
    }

    // 1. Validate API key
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

    // 2. Fetch ALL device tokens for user
    const { data: tokenRows, error: tokenError } = await supabaseAdmin
        .from('push_tokens')
        .select('token, device_id, updated_at')
        .eq('user_id', project.user_id)

    if (tokenError || !tokenRows?.length) {
        return res.status(404).json({ error: 'No push tokens found for this user' })
    }

    // 3. Deduplicate tokens (extra safety)
    const uniqueTokens = [...new Map(
        tokenRows.map(row => [row.token, row])
    ).values()]

    // 4. Filter valid Expo tokens
    const messages = uniqueTokens
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

    let status = 'sent'
    const tickets = []

    try {
        const chunks = expo.chunkPushNotifications(messages)

        for (const chunk of chunks) {
            const ticketChunk = await expo.sendPushNotificationsAsync(chunk)
            tickets.push(...ticketChunk)
        }
    } catch (err) {
        status = 'failed'
        console.error('Expo push error:', err)
    }

    // 5. (Optional but important) handle invalid tokens
    const invalidTokens = []

    tickets.forEach((ticket, index) => {
        if (ticket.status === 'error') {
            const token = messages[index].to

            if (
                ticket.details?.error === 'DeviceNotRegistered' ||
                ticket.details?.error === 'InvalidCredentials'
            ) {
                invalidTokens.push(token)
            }
        }
    })

    // Remove invalid tokens from DB
    if (invalidTokens.length) {
        await supabaseAdmin
            .from('push_tokens')
            .delete()
            .in('token', invalidTokens)
    }

    // 6. Log notification
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

    return res.status(200).json({
        message: 'Notification sent',
        sent: messages.length,
        removed_invalid_tokens: invalidTokens.length,
    })
}