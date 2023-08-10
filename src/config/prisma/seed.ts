import bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.roles.createMany({
    data: [{ name: 'admin' }, { name: 'operator' }, { name: 'distributor' }],
    skipDuplicates: true
  });
  await prisma.currencies.create({
    data: {
      name: 'Korean Won',
      code: 'KRW'
    }
  });
  await prisma.vendors.create({
    data: {
      name: 'evolution',
      url: `https://api.honorlink.org`
    }
  });
  for (let i = 1; i <= 400; i++) {
    await prisma.users.create({
      data: {
        name: faker.person.fullName(),
        username: `user.master.${String(i)}`,
        type: i % 2 === 0 ? 'player' : 'agent',
        password: await bcrypt.hash('admin.master.1', 10),
        email: `admin@master.com${i}`,
        roleId: 1,
        currencyId: 1
      }
    });
    if (i % 2 !== 0) {
      await prisma.agents.create({
        data: {
          id: i,
          level: i === 1 ? 1 : 2,
          parentAgentId: i === 1 ? null : 1,
          parentAgentIds: i === 1 ? [] : [1]
        }
      });

      await prisma.agentVendorTokens.create({
        data: {
          agentId: i,
          vendorId: 1
        }
      });
    } else {
      await prisma.players.create({
        data: { id: i, agentId: i - 1 }
      });
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });