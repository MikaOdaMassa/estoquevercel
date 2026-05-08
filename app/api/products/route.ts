import { NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location');

    const products = await prisma.product.findMany({
      where: location ? { location } : {},
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ result: 'success', data: products });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ result: 'error', message: error.message }, { status: 500 });
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
  } catch (error: any) {
    return NextResponse.json({ result: 'error', message: error.message }, { status: 500 });
  }
}
