import { NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';
import { cookies } from 'next/headers';

type TurnoProdutoPayload = {
  produtoId?: string;
  produtoNome?: string;
  estoqueInicial: number;
  entradas: number;
  estoqueFinal: number;
  custoAplicado: number;
  consumo: number;
  custo: number;
};

const VALID_LOCATIONS = ['COZINHA', 'BAR'] as const;
type Location = (typeof VALID_LOCATIONS)[number];

function isLocation(value: string | null | undefined): value is Location {
  return VALID_LOCATIONS.includes(value as Location);
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Erro inesperado';
}

function parseBrazilianDate(date: string) {
  const [day, month, year] = date.split('/').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedLocation = searchParams.get('location');
  
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get('user_role')?.value === 'ADMIN';
  const userLocation = cookieStore.get('user_location')?.value || 'COZINHA';
  const location = isAdmin
    ? isLocation(requestedLocation)
      ? requestedLocation
      : undefined
    : isLocation(userLocation)
      ? userLocation
      : 'COZINHA';

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
      Local: s.location,
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
  } catch (error: unknown) {
    return NextResponse.json({ result: 'error', message: getErrorMessage(error) }, { status: 500 });
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
    const cookieStore = await cookies();
    const isAdmin = cookieStore.get('user_role')?.value === 'ADMIN';
    const userLocation = cookieStore.get('user_location')?.value || 'COZINHA';
    const requestedShiftLocation = isLocation(location) ? location : 'COZINHA';
    const shiftLocation = isAdmin
      ? requestedShiftLocation
      : isLocation(userLocation)
        ? userLocation
        : 'COZINHA';

    // Use a transaction to ensure data integrity
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the shift
      const shift = await tx.shift.create({
        data: {
          date: parseBrazilianDate(data),
          responsible: responsavel,
          location: shiftLocation,
          period: periodo,
          totalSales: valorVendido,
          targetCmvPercentage: percentualMeta,
          status: 'AGUARDANDO_FATURAMENTO',
        },
      });

      // 2. Process each product
      for (const p of produtos as TurnoProdutoPayload[]) {
        const product = p.produtoId
          ? await tx.product.findUnique({ where: { id: p.produtoId } })
          : p.produtoNome
            ? await tx.product.findUnique({ where: { name: p.produtoNome } })
            : null;

        if (!product) {
          throw new Error(`Produto não encontrado para atualizar estoque: ${p.produtoNome || p.produtoId || 'sem identificação'}`);
        }

        if (product.location !== shiftLocation) {
          throw new Error(`Produto "${product.name}" pertence a ${product.location}, mas o turno é de ${shiftLocation}.`);
        }

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
  } catch (error: unknown) {
    console.error('Save Shift Error:', error);
    return NextResponse.json({ result: 'error', message: getErrorMessage(error) }, { status: 500 });
  }
}
