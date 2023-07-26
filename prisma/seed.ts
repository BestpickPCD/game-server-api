import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  await prisma.roles.createMany({
    data: [{ name: 'admin' }, { name: 'user' }],
    skipDuplicates: true
  });

  await prisma.currencies.create({
    data: {
      name: 'Korean Won',
      code: 'KRW'
    }
  });
  const hashedPassword = await bcrypt.hash('master', 10);

  await prisma.users.createMany({
    data: [
      {
        name: 'admin',
        username: 'admin',
        password: hashedPassword,
        email: 'admin@master.com',
        roleId: 1,
        currencyId: 1
      },
      {
        name: 'pngyn',
        username: 'pngyn',
        password: await bcrypt.hash('nguyen123!', 10),
        email: 'pngyn@pngyn.com',
        roleId: 1,
        currencyId: 1
      },
      {
        name: 'User Master',
        username: 'user',
        password: await bcrypt.hash('user.master.1', 10),
        email: 'user@master.com',
        roleId: 1,
        currencyId: 1
      }
    ]
  });

  const hashedPasswordAgent = await bcrypt.hash('agent.master.1', 10);
  await prisma.agents.create({
    data: {
      name: 'Agent Master',
      username: 'agent',
      password: hashedPasswordAgent,
      currencyId: 1,
      level: 1
    }
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
