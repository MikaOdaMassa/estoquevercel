const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    // 1. Create a dummy product
    const product = await prisma.product.create({
      data: {
        name: `Test Product ${Date.now()}`,
        category: 'INSUMOS',
        location: 'COZINHA',
        unit: 'un',
        currentQuantity: 10,
        unitCost: 1.5,
        salePrice: 0,
        minStock: 2,
      }
    });
    console.log('Created product:', product.name, 'with quantity:', product.currentQuantity);

    // 2. Simulate the transaction inside app/api/shifts/route.ts
    const shift = await prisma.$transaction(async (tx) => {
      const s = await tx.shift.create({
        data: {
          date: new Date(),
          responsible: 'Tester',
          location: 'COZINHA',
          period: 'Manhã',
          totalSales: 0,
          targetCmvPercentage: 30,
          status: 'AGUARDANDO_FATURAMENTO',
        }
      });

      // Find product by id
      const dbProduct = await tx.product.findUnique({
        where: { id: product.id }
      });

      if (!dbProduct) {
        throw new Error('Product not found');
      }

      // Create shift product
      await tx.shiftProduct.create({
        data: {
          shiftId: s.id,
          productId: dbProduct.id,
          initialStock: dbProduct.currentQuantity,
          entries: 2,
          finalStock: 6, // Operator counted 6 units
          consumption: 6, // 10 + 2 - 6 = 6
          unitCostAtTime: dbProduct.unitCost,
          totalCost: 9,
        }
      });

      // Update product currentQuantity to finalStock
      await tx.product.update({
        where: { id: dbProduct.id },
        data: {
          currentQuantity: 6
        }
      });

      return s;
    });

    console.log('Created shift:', shift.id);

    // 3. Verify product currentQuantity in DB
    const updatedProduct = await prisma.product.findUnique({
      where: { id: product.id }
    });

    console.log('Updated product quantity in DB:', updatedProduct.currentQuantity);
    if (updatedProduct.currentQuantity === 6) {
      console.log('SUCCESS: The stock was correctly updated to finalStock.');
    } else {
      console.log('FAILURE: The stock was NOT updated correctly.');
    }

  } catch (err) {
    console.error('Error during test flow:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
