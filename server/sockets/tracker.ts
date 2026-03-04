import { Server as SocketIOServer, Socket } from 'socket.io';

// In-memory store: staffId → { lat, lng, name, timestamp }
const activeLocations: Record<string, { lat: number; lng: number; name: string; staffId: string; timestamp: string }> = {};

export function setupTracker(io: SocketIOServer) {
    io.on('connection', (socket: Socket) => {
        console.log(`📡 Socket connected: ${socket.id}`);

        // Staff joins with their identity
        socket.on('staff:join', (data: { staffId: string; name: string; role: string }) => {
            socket.data.staffId = data.staffId;
            socket.data.name = data.name;
            socket.data.role = data.role;
            socket.join('staff');
            console.log(`🧑‍🔧 ${data.name} (${data.role}) joined`);
        });

        // Admin joins the tracking room
        socket.on('admin:join', () => {
            socket.join('admins');
            // Send current snapshot of all active locations
            socket.emit('location:snapshot', Object.values(activeLocations));
            console.log(`👤 Admin joined tracking room`);
        });

        // Staff emits their GPS location
        socket.on('location:update', (data: { lat: number; lng: number }) => {
            const staffId = socket.data.staffId;
            const name = socket.data.name;

            if (!staffId) return;

            const locationEntry = {
                staffId,
                name,
                lat: data.lat,
                lng: data.lng,
                timestamp: new Date().toISOString()
            };

            // Update in-memory store
            activeLocations[staffId] = locationEntry;

            // Broadcast to all admins
            io.to('admins').emit('location:update', locationEntry);
        });

        // Staff stops sharing location (trip ended or went offline)
        socket.on('location:stop', () => {
            const staffId = socket.data.staffId;
            if (staffId) {
                delete activeLocations[staffId];
                io.to('admins').emit('location:remove', { staffId });
                console.log(`🔴 ${socket.data.name} stopped sharing location`);
            }
        });

        socket.on('disconnect', () => {
            const staffId = socket.data.staffId;
            if (staffId) {
                delete activeLocations[staffId];
                io.to('admins').emit('location:remove', { staffId });
            }
            console.log(`❌ Socket disconnected: ${socket.id}`);
        });
    });
}

export { activeLocations };
