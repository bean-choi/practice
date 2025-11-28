// backend/prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const places = [
    {
      name: "창의관 앞",
      xCoord: 800,
      yCoord: 620,
      description: "중앙 광장 근처",
    },
    {
      name: "정문",
      xCoord: 400,
      yCoord: 950,
      description: "학교 정문",
    },
    // ...원하는 장소 계속 추가
  ];

  for (const p of places) {
    await prisma.place.upsert({
      where: { name: p.name },   // 이름으로 중복 방지
      update: {},
      create: p,
    });
  }

  console.log("Seed completed");
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
