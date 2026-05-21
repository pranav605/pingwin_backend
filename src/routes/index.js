import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { upsertToken } from '../controllers/tokens.js'
import {
    getProjects,
    createProject,
    updateProject,
    deleteProject,
    getApiKey,
    regenerateApiKey,
} from '../controllers/projects.js'
import { getAllNotifications, getNotifications } from '../controllers/notifications.js'
import { notify } from '../controllers/notify.js'

const router = Router()

// ── Tokens ──────────────────────────────────────
router.post('/tokens/upsert', requireAuth, upsertToken)

// ── Projects ─────────────────────────────────────
router.get('/projects', requireAuth, getProjects)
router.post('/projects', requireAuth, createProject)
router.put('/projects/:id', requireAuth, updateProject)
router.delete('/projects/:id', requireAuth, deleteProject)
router.get('/projects/:id/apikey', requireAuth, getApiKey)
router.post('/projects/:id/apikey/regenerate', requireAuth, regenerateApiKey)

// ── Notifications ────────────────────────────────
router.get('/notifications', requireAuth, getNotifications)
router.get('/notifications/all', requireAuth, getAllNotifications)

// ── Notify (public — API key auth) ───────────────
router.post('/notify', notify)

export default router