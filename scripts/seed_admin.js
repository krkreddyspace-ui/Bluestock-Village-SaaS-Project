require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@bluestock.in';
  const adminPassword = 'admin123'; // Default password for dev

  console.log('Seeding admin user...');

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash, status: 'ACTIVE', role: 'ADMIN' },
    create: {
      email: adminEmail,
      businessName: 'Bluestock Fintech',
      passwordHash,
      planType: 'UNLIMITED',
      status: 'ACTIVE',
      role: 'ADMIN'
    },
  });

  console.log(`✅ Admin user created/updated: ${admin.email} (ID: ${admin.id})`);
  console.log(`   Password: ${adminPassword}`);

  // Create a demo API key for testing
  const apiKey = `bsk_${crypto.randomBytes(24).toString('hex')}`;
  const apiSecret = `bss_${crypto.randomBytes(32).toString('hex')}`;
  const secretHash = await bcrypt.hash(apiSecret, 10);

  const existingKey = await prisma.apiKey.findFirst({
    where: { userId: admin.id, name: 'Demo Key' },
  });

  if (!existingKey) {
    await prisma.apiKey.create({
      data: {
        name: 'Demo Key',
        key: apiKey,
        secretHash,
        userId: admin.id,
      },
    });
    console.log(`\n🔑 Demo API Key created:`);
    console.log(`   Key:    ${apiKey}`);
    console.log(`   Secret: ${apiSecret}`);
    console.log(`   (Save these — the secret won't be shown again)`);
  } else {
    console.log(`\n🔑 Demo API Key already exists (key: ${existingKey.key})`);
  }

  // Also create a demo B2B client
  const clientPassword = 'client123';
  const clientHash = await bcrypt.hash(clientPassword, 12);

  const client = await prisma.user.upsert({
    where: { email: 'demo@company.com' },
    update: { passwordHash: clientHash, status: 'ACTIVE' },
    create: {
      email: 'demo@company.com',
      businessName: 'Demo Corp',
      passwordHash: clientHash,
      planType: 'PREMIUM',
      status: 'ACTIVE',
    },
  });

  console.log(`\n✅ Demo B2B client created/updated: ${client.email}`);
  console.log(`   Password: ${clientPassword}`);

  console.log('\n🎉 Seed complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
