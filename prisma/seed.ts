import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@linktracker.local" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@linktracker.local",
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log("Admin user created:", admin.email);

  const campaign = await prisma.campaign.upsert({
    where: { id: "seed-campaign-1" },
    update: {},
    create: {
      id: "seed-campaign-1",
      name: "Campagne SEO Demo",
      description: "Campagne de demonstration pour tester l'outil",
      targetDomain: "example.com",
      status: "ACTIVE",
      createdById: admin.id,
    },
  });

  console.log("Demo campaign created:", campaign.name);

  await prisma.campaignMember.upsert({
    where: {
      campaignId_userId: {
        campaignId: campaign.id,
        userId: admin.id,
      },
    },
    update: {},
    create: {
      campaignId: campaign.id,
      userId: admin.id,
    },
  });

  console.log("Seed completed successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
