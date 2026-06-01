import { db } from '@rumbo/db';

const email = process.argv[2]?.toLowerCase().trim();

if (!email) {
  console.error('Usage: npm run grant-platform-admin --workspace=@rumbo/auth -- user@example.com');
  process.exit(1);
}

const user = await db.user.update({
  where: { email },
  data: { isPlatformAdmin: true },
  select: { id: true, email: true, isPlatformAdmin: true },
});

console.log(`Granted platform admin access to ${user.email} (${user.id}).`);
await db.$disconnect();

