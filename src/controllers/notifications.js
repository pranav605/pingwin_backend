import { supabaseAdmin } from '../config/supabase.js'

// GET /api/notifications?projectId=
export async function getNotifications(req, res) {
    const { projectId } = req.query

    if (!projectId) {
        return res.status(400).json({ error: 'projectId query param is required' })
    }

    // Verify the project belongs to the requesting user
    const { data: project, error: projectError } = await supabaseAdmin
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .eq('user_id', req.userId)
        .single()

    if (projectError || !project) {
        return res.status(404).json({ error: 'Project not found' })
    }

    const { data, error } = await supabaseAdmin
        .from('notifications')
        .select('id, title, body, status, created_at')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(50)

    if (error) return res.status(500).json({ error: error.message })

    return res.status(200).json(data)
}
// GET /api/notifications/all
export async function getAllNotifications(req, res) {
    const { data, error } = await supabaseAdmin
        .from('notifications, projects')
        .select('id, project_id, projects.name as project_name, title, body, status, created_at')
        .eq('user_id', req.userId)
        .order('created_at', { ascending: false })
        .limit(100);

    if (error) return res.status(500).json({ error: error.message })

    return res.status(200).json(data)
}