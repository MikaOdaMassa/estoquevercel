import { NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get('location');
  
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get('user_role')?.value === 'ADMIN';
  
  if (!isAdmin) {
    return NextResponse.json({ result: 'error', message: 'Acesso negado. Requer privilégios de administrador.' }, { status: 403 });
  }

  try {
    const shifts = await prisma.shift.findMany({
      where: location ? { location } : {},
      include: {
        products: {
          include: {
            product: true
          }
        }
      },
      orderBy: { date: 'desc' },
    });
    
    // Transform to match the old frontend format
    const formatted = shifts.map(s => ({
      ID: s.id,
      Data: s.date.toLocaleDateString('pt-BR'),
      Responsavel: s.responsible,
      Periodo: s.period,
      Status: s.status,
      ValorVendido: s.totalSales, // Still sending for compatibility or gross sales
      PercentualMeta: s.targetCmvPercentage,
      IfoodNet: s.ifoodNet,
      NinetynineNet: s.ninetynineNet,
      CounterNet: s.counterNet,
      MachineFees: s.machineFees,
      Discounts: s.discounts,
      RealFinalSales: s.realFinalSales,
      Produtos: s.products.map(sp => ({
        produtoNome: sp.product.name,
        categoria: sp.product.category,
        unidade: sp.product.unit,
        estoqueInicial: sp.initialStock,
        entradas: sp.entries,
        estoqueFinal: sp.finalStock,
        custoAplicado: sp.unitCostAtTime,
        consumo: sp.consumption,
        custo: sp.totalCost,
      }))
    }));

    return NextResponse.json({ result: 'success', data: formatted });
  } catch (error: any) {
    return NextResponse.json({ result: 'error', message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, turno } = body;

    if (action !== 'saveTurno') {
       return NextResponse.json({ result: 'error', message: 'Invalid action' }, { status: 400 });
    }

    const { data, responsavel, periodo, valorVendido = 0, percentualMeta = 30, produtos, location } = turno;

    // Use a transaction to ensure data integrity
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the shift
      const shift = await tx.shift.create({
        data: {
          date: new Date(data.split('/').reverse().join('-')), // Converte dd/mm/yyyy para yyyy-mm-dd
          responsible: responsavel,
          location: location || 'COZINHA',
          period: periodo,
          totalSales: valorVendido,
          targetCmvPercentage: percentualMeta,
          status: 'AGUARDANDO_FATURAMENTO',
        },
      });

      // 2. Process each product
      for (const p of produtos) {
        // Find product by name (assuming name is unique as per schema)
        const product = await tx.product.findUnique({
          where: { name: p.produtoNome }
        });

        if (!product) continue;

        // Save shift product snapshot
        await tx.shiftProduct.create({
          data: {
            shiftId: shift.id,
            productId: product.id,
            initialStock: p.estoqueInicial,
            entries: p.entradas,
            finalStock: p.estoqueFinal,
            consumption: p.consumo,
            unitCostAtTime: p.custoAplicado,
            totalCost: p.custo,
          }
        });

        // 3. Update main product stock
        await tx.product.update({
          where: { id: product.id },
          data: {
            currentQuantity: p.estoqueFinal // The final stock of this shift becomes the new current stock
          }
        });
      }

      return shift;
    });

    return NextResponse.json({ result: 'success', data: result });
  } catch (error: any) {
    console.error('Save Shift Error:', error);
    return NextResponse.json({ result: 'error', message: error.message }, { status: 500 });
  }
}
