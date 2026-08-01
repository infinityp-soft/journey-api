import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const email = (
    process.env.SEED_ADMIN_EMAIL ?? 'admin@journeyth-edu.com'
  ).toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';
  const name = process.env.SEED_ADMIN_NAME ?? 'Super Administrator';

  // --- Bootstrap admin ---
  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name,
      email,
      role: 'admin',
      passwordHash: await bcrypt.hash(password, 12),
      isActive: true,
    },
  });
  console.log(`Admin user ready: ${admin.email}`);

  // --- Singleton rows (idempotent) ---
  const aboutCount = await prisma.aboutUs.count();
  if (aboutCount === 0) await prisma.aboutUs.create({ data: {} });

  const videoPageCount = await prisma.videoPageSettings.count();
  if (videoPageCount === 0)
    await prisma.videoPageSettings.create({ data: {} });

  const settingsCount = await prisma.siteSettings.count();
  if (settingsCount === 0) await prisma.siteSettings.create({ data: {} });

  console.log('Singleton settings rows ensured.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
