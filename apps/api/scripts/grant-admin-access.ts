import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const FULL_PERMISSIONS = [
  { entity: "*", actions: ["create", "read", "update", "delete"] },
] as const;

async function main() {
  const phone = process.argv[2]?.trim() || "09907043664";

  let role = await prisma.role.findFirst({
    where: { OR: [{ legacyId: "admin-role" }, { title: "مدیر کل" }] },
  });

  if (!role) {
    role = await prisma.role.create({
      data: {
        title: "مدیر کل",
        legacyId: "admin-role",
        permissions: FULL_PERMISSIONS,
      },
    });
    console.log("Created admin role:", role.id);
  } else {
    role = await prisma.role.update({
      where: { id: role.id },
      data: { permissions: FULL_PERMISSIONS },
    });
    console.log("Updated admin role permissions:", role.id);
  }

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (!existing) {
    throw new Error(`User not found for phone ${phone}`);
  }

  const user = await prisma.user.update({
    where: { phone },
    data: { roleId: role.id },
    include: { role: true },
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        phone: user.phone,
        userId: user.id,
        roleId: user.roleId,
        roleTitle: user.role?.title,
        permissions: user.role?.permissions,
      },
      null,
      2
    )
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
