import { supabaseAdmin } from '../config/supabase.js'

// GET /api/projects
export async function getProjects(req, res) {
    const { data, error } = await supabaseAdmin
        .from('projects')
        .select('id, name, description, is_active, created_at')
        .eq('user_id', req.userId)
        .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ error: error.message })

    return res.status(200).json(data)
}

// POST /api/projects
export async function createProject(req, res) {
    const { name, description, is_active } = req.body

    if (!name) {
        return res.status(400).json({ error: 'name is required' })
    }

    const { data, error } = await supabaseAdmin
        .from('projects')
        .insert({ user_id: req.userId, name, description, is_active })
        .select('id, name, description, is_active, created_at')
        .single()

    if (error) return res.status(500).json({ error: error.message })

    return res.status(201).json(data)
}

// PUT /api/projects/:id
export async function updateProject(req, res) {
    const { id } = req.params
    const { name, description, is_active } = req.body

    // Verify ownership before updating
    const { data: existing, error: fetchError } = await supabaseAdmin
        .from('projects')
        .select('id')
        .eq('id', id)
        .eq('user_id', req.userId)
        .single()

    if (fetchError || !existing) {
        return res.status(404).json({ error: 'Project not found' })
    }

    const { data, error } = await supabaseAdmin
        .from('projects')
        .update({ name, description, is_active })
        .eq('id', id)
        .select('id, name, description, is_active, created_at')
        .single()

    if (error) return res.status(500).json({ error: error.message })

    return res.status(200).json(data)
}

// DELETE /api/projects/:id
export async function deleteProject(req, res) {
    const { id } = req.params

    // Verify ownership before deleting
    const { data: existing, error: fetchError } = await supabaseAdmin
        .from('projects')
        .select('id')
        .eq('id', id)
        .eq('user_id', req.userId)
        .single()

    if (fetchError || !existing) {
        return res.status(404).json({ error: 'Project not found' })
    }

    const { error } = await supabaseAdmin
        .from('projects')
        .delete()
        .eq('id', id)

    if (error) return res.status(500).json({ error: error.message })

    return res.status(200).json({ message: 'Project deleted' })
}

// GET /api/projects/:id/apikey
export async function getApiKey(req, res) {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
        .from('projects')
        .select('api_key')
        .eq('id', id)
        .eq('user_id', req.userId)
        .single()

    if (error || !data) {
        return res.status(404).json({ error: 'Project not found' })
    }

    return res.status(200).json({ api_key: data.api_key })
}

// POST /api/projects/:id/apikey/regenerate
export async function regenerateApiKey(req, res) {
    const { id } = req.params

    // Verify ownership
    const { data: existing, error: fetchError } = await supabaseAdmin
        .from('projects')
        .select('id')
        .eq('id', id)
        .eq('user_id', req.userId)
        .single()

    if (fetchError || !existing) {
        return res.status(404).json({ error: 'Project not found' })
    }

    // gen_random_uuid() via rpc to generate a new key
    const { data, error } = await supabaseAdmin
        .from('projects')
        .update({ api_key: crypto.randomUUID() })
        .eq('id', id)
        .select('api_key')
        .single()

    if (error) return res.status(500).json({ error: error.message })

    return res.status(200).json({ api_key: data.api_key })
}