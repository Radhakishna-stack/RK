import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../prisma.js';
import { authenticate, requireRoles, AuthRequest } from '../middleware/auth.js';
import { Response } from 'express';

const router = Router();
router.use(authenticate as any);

// GET /api/users — all users (admin/manager)
router.get('/', requireRoles('admin', 'manager') as any, async (_req, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, name: true, phone: true, role: true, isActive: true, createdAt: true }
        });
        res.json(users);
    } catch {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// GET /api/users/staff — only drivers and mechanics (for assignment dropdowns)
router.get('/staff', requireRoles('admin', 'manager') as any, async (_req, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            where: { role: { in: ['driver', 'mechanic'] }, isActive: true },
            select: { id: true, name: true, phone: true, role: true }
        });
        res.json(users);
    } catch {
        res.status(500).json({ error: 'Failed to fetch staff' });
    }
});

// POST /api/users — create user (admin only)
router.post('/', requireRoles('admin') as any, async (req: AuthRequest, res: Response) => {
    try {
        const { name, phone, password, role } = req.body;
        if (!name || !phone || !password || !role) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const existing = await prisma.user.findUnique({ where: { phone } });
        if (existing) return res.status(409).json({ error: 'Phone number already registered' });

        const hashed = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { name, phone, password: hashed, role },
            select: { id: true, name: true, phone: true, role: true }
        });

        res.status(201).json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// PATCH /api/users/:id/toggle — toggle active/inactive
router.patch('/:id/toggle', requireRoles('admin') as any, async (req, res: Response) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.params.id } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const updated = await prisma.user.update({
            where: { id: req.params.id },
            data: { isActive: !user.isActive },
            select: { id: true, name: true, isActive: true }
        });
        res.json(updated);
    } catch {
        res.status(500).json({ error: 'Failed to toggle user status' });
    }
});

export default router;
