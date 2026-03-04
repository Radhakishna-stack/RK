import { Router } from 'express';
import prisma from '../prisma.js';
import { authenticate, requireRoles, AuthRequest } from '../middleware/auth.js';
import { Response } from 'express';
import { sendJobAssignment, sendStatusUpdate } from '../services/whatsapp.js';

const router = Router();

// All routes require authentication
router.use(authenticate as any);

// GET /api/requests — all requests (admin/manager only)
router.get('/', requireRoles('admin', 'manager') as any, async (_req, res: Response) => {
    try {
        const requests = await prisma.serviceRequest.findMany({
            include: { assignedDriver: true, assignedMechanic: true, statusLogs: { orderBy: { timestamp: 'desc' } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch requests' });
    }
});

// GET /api/requests/open — unassigned pool (self-assign eligible)
router.get('/open', async (req: AuthRequest, res: Response) => {
    try {
        const role = req.user!.role;
        let where: any = {};

        if (role === 'driver') {
            // Open pickup tasks (no driver assigned yet, at start-trip eligble status)
            where = {
                assignedDriverId: null,
                status: { in: ['Assigned', 'Repair Complete'] }
            };
        } else if (role === 'mechanic') {
            // Bikes at store waiting for mechanic
            where = {
                assignedMechanicId: null,
                status: 'Delivered to Store'
            };
        }

        const requests = await prisma.serviceRequest.findMany({
            where,
            include: { statusLogs: { orderBy: { timestamp: 'desc' }, take: 1 } },
            orderBy: { createdAt: 'asc' }
        });
        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch open requests' });
    }
});

// GET /api/requests/mine — tasks assigned to me
router.get('/mine', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const role = req.user!.role;

        const where = role === 'mechanic'
            ? { assignedMechanicId: userId }
            : { assignedDriverId: userId };

        const requests = await prisma.serviceRequest.findMany({
            where,
            include: { statusLogs: { orderBy: { timestamp: 'desc' }, take: 3 } },
            orderBy: { updatedAt: 'desc' }
        });
        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch my tasks' });
    }
});

// GET /api/requests/:id — single request detail
router.get('/:id', async (req, res: Response) => {
    try {
        const request = await prisma.serviceRequest.findUnique({
            where: { id: req.params.id },
            include: {
                assignedDriver: true,
                assignedMechanic: true,
                statusLogs: { orderBy: { timestamp: 'desc' } }
            }
        });
        if (!request) return res.status(404).json({ error: 'Request not found' });
        res.json(request);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch request' });
    }
});

// POST /api/requests — create new service request (admin/manager)
router.post('/', requireRoles('admin', 'manager') as any, async (req: AuthRequest, res: Response) => {
    try {
        const { customerName, customerPhone, customerCity, locationLink, bikeDetails, notes, assignedDriverId } = req.body;
        if (!customerName || !customerPhone || !customerCity) {
            return res.status(400).json({ error: 'Customer name, phone and city are required' });
        }

        const request = await prisma.serviceRequest.create({
            data: {
                customerName, customerPhone, customerCity, locationLink, bikeDetails, notes,
                assignedDriverId: assignedDriverId || null,
                status: 'Assigned'
            }
        });

        // Log the initial status
        await prisma.statusLog.create({
            data: { requestId: request.id, status: 'Assigned', changedBy: req.user!.name }
        });

        res.status(201).json(request);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create request' });
    }
});

// PATCH /api/requests/:id/assign — assign driver or mechanic
router.patch('/:id/assign', requireRoles('admin', 'manager') as any, async (req: AuthRequest, res: Response) => {
    try {
        const { assignedDriverId, assignedMechanicId } = req.body;
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

        const updated = await prisma.serviceRequest.update({
            where: { id },
            data: {
                ...(assignedDriverId !== undefined && { assignedDriverId }),
                ...(assignedMechanicId !== undefined && { assignedMechanicId })
            },
            include: {
                assignedDriver: true,
                assignedMechanic: true
            }
        });

        // Send WhatsApp notification if a driver/mechanic is newly assigned
        if (assignedDriverId && updated.assignedDriver) {
            await sendJobAssignment(
                updated.customerPhone,
                updated.customerName,
                updated.assignedDriver.name,
                'Driver'
            );
        } else if (assignedMechanicId && updated.assignedMechanic) {
            await sendJobAssignment(
                updated.customerPhone,
                updated.customerName,
                updated.assignedMechanic.name,
                'Mechanic'
            );
        }

        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: 'Failed to assign staff' });
    }
});

// PATCH /api/requests/:id/self-assign — staff/mechanic self-assign
router.patch('/:id/self-assign', async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user!;
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

        const request = await prisma.serviceRequest.findUnique({ where: { id } });
        if (!request) return res.status(404).json({ error: 'Request not found' });

        let updateData: any = {};
        if (user.role === 'driver') {
            if (request.assignedDriverId) return res.status(409).json({ error: 'Already assigned to another driver' });
            updateData.assignedDriverId = user.id;
        } else if (user.role === 'mechanic') {
            if (request.assignedMechanicId) return res.status(409).json({ error: 'Already assigned to another mechanic' });
            updateData.assignedMechanicId = user.id;
            updateData.status = 'Mechanic Assigned';
        }

        const updated = await prisma.serviceRequest.update({
            where: { id },
            data: updateData
        });

        await prisma.statusLog.create({
            data: { requestId: request.id, status: updateData.status || request.status, changedBy: `${user.name} (self-assigned)` }
        });

        // Send WhatsApp notification to the customer
        await sendJobAssignment(
            updated.customerPhone,
            updated.customerName,
            user.name,
            user.role === 'mechanic' ? 'Mechanic' : 'Driver'
        );

        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: 'Failed to self-assign' });
    }
});

// PATCH /api/requests/:id/status — update status
router.patch('/:id/status', async (req: AuthRequest, res: Response) => {
    try {
        const { status } = req.body;
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

        const validStatuses = [
            'Assigned', 'Start Trip', 'Picked Up', 'Delivered to Store',
            'Mechanic Assigned', 'Under Repair', 'Repair Complete',
            'Out for Delivery', 'Delivered'
        ];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const updated = await prisma.serviceRequest.update({
            where: { id },
            data: { status }
        });

        await prisma.statusLog.create({
            data: { requestId: id, status, changedBy: req.user!.name }
        });

        // Notify customer via WhatsApp
        await sendStatusUpdate(
            updated.customerPhone,
            updated.customerName,
            status,
            `Update performed by ${req.user!.name}`
        );

        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update status' });
    }
});

export default router;
