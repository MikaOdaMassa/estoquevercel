import { NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';

export const dynamic = 'force-dynamic';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Erro inesperado';
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location');

    const products = await prisma.product.findMany({
      where: location ? { location } : {},
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(
      { result: 'success', data: products },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error: unknown) {
    console.error('API Error:', error);
    return NextResponse.json({ result: 'error', message: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, name, category, location, unit, currentQuantity, unitCost, salePrice, minStock } = body;

    if (id) {
      const product = await prisma.product.update({
        where: { id },
        data: { name, category, location, unit, currentQuantity, unitCost, salePrice, minStock },
      });
      return NextResponse.json({ result: 'success', data: product });
    } else {
      const product = await prisma.product.create({
        data: { name, category, location: location || 'COZINHA', unit, currentQuantity, unitCost, salePrice, minStock },
      });
      return NextResponse.json({ result: 'success', data: product });
    }
  } catch (error: unknown) {
    return NextResponse.json({ result: 'error', message: getErrorMessage(error) }, { status: 500 });
  }
}
