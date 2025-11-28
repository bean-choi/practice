// backend/prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const places = [
    {
      name: "창의학습관",
      xCoord: 1052,
      yCoord: 981,
      description: "창학",
    },
    {
      name: "정문",
      xCoord: 1046,
      yCoord: 1502,
      description: "학교 정문",
    },
    {
      name: "스포츠 컴플렉스",
      xCoord: 1092,
      yCoord: 761,
      description: "스컴~",
    },
    {
      name: "교양 분관",
      xCoord: 1027,
      yCoord: 577,
      description: "교분",
    },
    {
      name: "엔들리스 로드",
      xCoord: 160,
      yCoord: 1165,
      description: "",
    },
    {
      name: "오리 연못",
      xCoord: 1005,
      yCoord: 1250,
      description: "거위 연못",
    },
    {
      name: "카이마루",
      xCoord: 822,
      yCoord: 637,
      description: "카마",
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
