const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    const products = await prisma.product.findMany();
    console.log('PRODUCTS:');
    console.log(JSON.stringify(products, null, 2));

    const shifts = await prisma.shift.findMany({
      include: {
        products: true
      }
    });
    console.log('SHIFTS:');
    console.log(JSON.stringify(shifts, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}
main();
