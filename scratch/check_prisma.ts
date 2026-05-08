import { prisma } from '../app/lib/prisma';

async function main() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        location: true,
      }
    });
    console.log('Success:', users);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
