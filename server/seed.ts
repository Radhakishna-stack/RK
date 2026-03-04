import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import bcrypt from 'bcryptjs';

const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

async function seed() {
    console.log('🌱 Seeding database...');

    const count = await prisma.user.count();
    if (count > 0) {
        console.log('✅ Database already seeded. Existing users:');
        const users = await prisma.user.findMany({ select: { id: true, name: true, phone: true, role: true } });
        console.table(users);
        process.exit(0);
    }

    const users = [
        { name: 'Admin SRK', phone: '9999999999', password: 'admin123', role: 'admin' },
        { name: 'Manager Raj', phone: '9888888888', password: 'manager123', role: 'manager' },
        { name: 'Driver Arun', phone: '9777777777', password: 'driver123', role: 'driver' },
        { name: 'Mechanic Suresh', phone: '9666666666', password: 'mechanic123', role: 'mechanic' },
    ];

    for (const user of users) {
        await prisma.user.create({
            data: { ...user, password: await bcrypt.hash(user.password, 10) }
        });
    }

    console.log('\n✅ Database seeded successfully!');
    console.log('\nUsers created:');
    console.table(users.map(u => ({ name: u.name, phone: u.phone, role: u.role, password: u.password })));

    process.exit(0);
}

seed().catch((err) => {
    console.error('❌ Seed failed:', err.message || err);
    process.exit(1);
});
