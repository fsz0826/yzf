import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findUnique({ where: { username: 'admin' } });
  if (!existing) {
    const hash = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: { username: 'admin', password: hash, name: '管理员', role: 'admin' },
    });
    console.log('Admin user created: admin / admin123');
  } else {
    console.log('Admin user already exists');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
