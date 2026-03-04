import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'motogear_secret';

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { phone, password } = req.body;

        if (!phone || !password) {
            return res.status(400).json({ error: 'Phone and password are required' });
        }

        const user = await prisma.user.findUnique({ where: { phone } });

        if (!user || !user.isActive) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, name: user.name, role: user.role, phone: user.phone },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: { id: user.id, name: user.name, role: user.role, phone: user.phone }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Login failed' });
    }
});

// POST /api/auth/setup — create first admin (use only once)
router.post('/setup', async (req, res) => {
    try {
        const count = await prisma.user.count();
        if (count > 0) {
            return res.status(403).json({ error: 'Setup already completed' });
        }

        const { name, phone, password } = req.body;
        const hashed = await bcrypt.hash(password, 10);
        const admin = await prisma.user.create({
            data: { name, phone, password: hashed, role: 'admin' }
        });

        res.json({ message: 'Admin created successfully', id: admin.id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Setup failed' });
    }
});

export default router;
