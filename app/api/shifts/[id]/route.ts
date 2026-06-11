import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { cookies } from 'next/headers';

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getShiftDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

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
    const consolidatedShiftIds = Array.isArray(body.consolidatedShiftIds)
      ? Array.from(new Set(body.consolidatedShiftIds.filter((shiftId: unknown): shiftId is string => typeof shiftId === 'string' && shiftId.trim().length > 0)))
      : [];

    const financialData = {
      status: 'CONCLUIDO',
      ifoodNet: toNumber(body.ifoodNet),
      ninetynineNet: toNumber(body.ninetynineNet),
      counterNet: toNumber(body.counterNet),
      machineFees: toNumber(body.machineFees),
      discounts: toNumber(body.discounts),
      realFinalSales: toNumber(body.realFinalSales),
      totalSales: toNumber(body.totalSales),
      targetCmvPercentage: toNumber(body.targetCmvPercentage, 30),
    };

    if (consolidatedShiftIds.length > 1) {
      const updatedShift = await prisma.$transaction(async (tx) => {
        const shifts = await tx.shift.findMany({
          where: { id: { in: consolidatedShiftIds } },
        });

        if (shifts.length !== consolidatedShiftIds.length || !shifts.some(shift => shift.id === id)) {
          throw new Error('Grupo de fechamento inválido.');
        }

        const currentShift = shifts.find(shift => shift.id === id);
        if (!currentShift) {
          throw new Error('Turno não encontrado no grupo de fechamento.');
        }

        const dateKey = getShiftDateKey(currentShift.date);
        const sameFinancialGroup = shifts.every(shift => getShiftDateKey(shift.date) === dateKey && shift.period === currentShift.period);
        if (!sameFinancialGroup) {
          throw new Error('Só é possível consolidar turnos do mesmo dia e período.');
        }

        const financialOwner = shifts.find(shift => shift.location === 'COZINHA') || currentShift;
        const relatedShiftData = {
          status: 'CONCLUIDO',
          ifoodNet: 0,
          ninetynineNet: 0,
          counterNet: 0,
          machineFees: 0,
          discounts: 0,
          realFinalSales: 0,
          totalSales: 0,
          targetCmvPercentage: financialData.targetCmvPercentage,
        };

        const owner = await tx.shift.update({
          where: { id: financialOwner.id },
          data: financialData,
        });

        await Promise.all(
          shifts
            .filter(shift => shift.id !== financialOwner.id)
            .map(shift => tx.shift.update({
              where: { id: shift.id },
              data: relatedShiftData,
            }))
        );

        return owner;
      });

      return NextResponse.json({ result: 'success', data: updatedShift });
    }

    const updatedShift = await prisma.shift.update({
      where: { id },
      data: financialData,
    });

    return NextResponse.json({ result: 'success', data: updatedShift });
  } catch (error: any) {
    return NextResponse.json({ result: 'error', message: error.message }, { status: 500 });
  }
}
