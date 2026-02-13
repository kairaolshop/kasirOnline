const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admindhalisa', 10);
  
  const user = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'dhalisa',
      password: hashedPassword,
      role: 'admin',
    },
  });

  console.log('User pertama berhasil dibuat:', user.username);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());