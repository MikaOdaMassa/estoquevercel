import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { cookies } from 'next/headers';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get('user_role')?.value === 'ADMIN';
  if (!isAdmin) return NextResponse.json({ result: 'error', message: 'Acesso negado.' }, { status: 403 });

  try {
    const { id } = await params;

    await prisma.shift.delete({
      where: { id },
    });

    return NextResponse.json({ result: 'success', message: 'Turno deletado com sucesso!' });
  } catch (error: any) {
    return NextResponse.json({ result: 'error', message: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
    const cookieStore = await cookies();
    const isAdmin = cookieStore.get('user_role')?.value === 'ADMIN';
    if (!isAdmin) return NextResponse.json({ result: 'error', message: 'Acesso negado.' }, { status: 403 });

    // Some frontend code might still use POST with an action field for deletion
    try {
        const body = await request.json();
        if (body.action === 'deleteTurno') {
            await prisma.shift.delete({
                where: { id: body.turnoId },
            });
            return NextResponse.json({ result: 'success', message: 'Turno deletado com sucesso!' });
        }
        return NextResponse.json({ result: 'error', message: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ result: 'error', message: error.message }, { status: 500 });
    }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get('user_role')?.value === 'ADMIN';
  if (!isAdmin) return NextResponse.json({ result: 'error', message: 'Acesso negado.' }, { status: 403 });

  try {
    const { id } = await params;
    const body = await request.json();

    const updatedShift = await prisma.shift.update({
      where: { id },
      data: {
        status: 'CONCLUIDO',
        ifoodNet: body.ifoodNet,
        ninetynineNet: body.ninetynineNet,
        counterNet: body.counterNet,
        machineFees: body.machineFees,
        discounts: body.discounts,
        realFinalSales: body.realFinalSales,
        totalSales: body.totalSales, // Or gross sales if we keep tracking it
        targetCmvPercentage: body.targetCmvPercentage,
      },
    });

    return NextResponse.json({ result: 'success', data: updatedShift });
  } catch (error: any) {
    return NextResponse.json({ result: 'error', message: error.message }, { status: 500 });
  }
}
