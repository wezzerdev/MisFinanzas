import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { DebtType, DebtStatus, TransactionType, CategoryType } from "@prisma/client";

export async function GET() {
  try {
    const debts = await prisma.debt.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: {
        account: true,
        transactions: {
          orderBy: { date: "desc" },
          include: { account: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: debts });
  } catch (error: any) {
    console.error("API GET /api/debts Error:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener deudas." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const {
      title,
      counterparty,
      type,
      totalAmount,
      paidAmount = 0,
      dueDate,
      isMsi = false,
      installments,
      remainingInstallments,
      monthlyPayment,
      accountId,
      notes,
      affectAccountBalance = false,
    } = await req.json();

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, error: "El concepto o título de la deuda es requerido." },
        { status: 400 }
      );
    }

    if (!totalAmount || isNaN(Number(totalAmount)) || Number(totalAmount) <= 0) {
      return NextResponse.json(
        { success: false, error: "El monto total debe ser mayor a 0." },
        { status: 400 }
      );
    }

    const parsedTotal = parseFloat(String(totalAmount));
    const parsedPaid = parseFloat(String(paidAmount)) || 0;
    const debtType = type === "THEY_OWE" ? DebtType.THEY_OWE : DebtType.I_OWE;
    const parsedInstallments = installments ? parseInt(String(installments), 10) : null;
    const parsedRemaining = remainingInstallments
      ? parseInt(String(remainingInstallments), 10)
      : parsedInstallments;
    const remainingBalance = Math.max(0, parsedTotal - parsedPaid);
    const computedMonthly =
      monthlyPayment !== undefined && monthlyPayment !== null
        ? parseFloat(String(monthlyPayment))
        : parsedRemaining && parsedRemaining > 0
        ? Number((remainingBalance / parsedRemaining).toFixed(2))
        : remainingBalance;

    const createdDebt = await prisma.$transaction(async (tx) => {
      const debt = await (tx.debt as any).create({
        data: {
          title: title.trim(),
          counterparty: counterparty ? String(counterparty).trim() : null,
          type: debtType,
          totalAmount: parsedTotal,
          paidAmount: parsedPaid,
          dueDate: dueDate ? new Date(dueDate) : null,
          isMsi: Boolean(isMsi),
          installments: parsedInstallments,
          remainingInstallments: parsedRemaining,
          monthlyPayment: computedMonthly,
          accountId: accountId || null,
          notes: notes ? String(notes).trim() : null,
          status: parsedPaid >= parsedTotal ? DebtStatus.PAID : DebtStatus.ACTIVE,
        },
        include: {
          account: true,
          transactions: true,
        },
      });

      if (affectAccountBalance && accountId) {
        const netInitialAmount = Math.max(0, parsedTotal - parsedPaid);
        if (netInitialAmount > 0) {
          let category = await tx.category.findFirst({
            where: {
              type: debtType === DebtType.I_OWE ? CategoryType.INCOME : CategoryType.EXPENSE,
            },
          });

          if (!category) {
            category = await tx.category.create({
              data: {
                name: debtType === DebtType.I_OWE ? "Préstamos Recibidos" : "Préstamos Otorgados",
                type: debtType === DebtType.I_OWE ? CategoryType.INCOME : CategoryType.EXPENSE,
                icon: "HandCoins",
                color: "#009fdb",
              },
            });
          }

          await tx.transaction.create({
            data: {
              amount: netInitialAmount,
              type: debtType === DebtType.I_OWE ? TransactionType.INCOME : TransactionType.EXPENSE,
              date: new Date(),
              note:
                debtType === DebtType.I_OWE
                  ? `Préstamo recibido: ${title.trim()}`
                  : `Préstamo otorgado: ${title.trim()}`,
              accountId,
              categoryId: category.id,
              debtId: debt.id,
            },
          });

          if (debtType === DebtType.I_OWE) {
            await tx.account.update({
              where: { id: accountId },
              data: { balance: { increment: netInitialAmount } },
            });
          } else {
            await tx.account.update({
              where: { id: accountId },
              data: { balance: { decrement: netInitialAmount } },
            });
          }
        }
      }

      return debt;
    });

    return NextResponse.json({ success: true, data: createdDebt }, { status: 201 });
  } catch (error: any) {
    console.error("API POST /api/debts Error:", error);
    return NextResponse.json(
      { success: false, error: "Error al crear la deuda." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      action = "EDIT",
      title,
      counterparty,
      type,
      totalAmount,
      paidAmount,
      dueDate,
      installments,
      remainingInstallments,
      monthlyPayment,
      notes,
      status,
      paymentAmount,
      accountId,
      paymentNote,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID de deuda requerido." },
        { status: 400 }
      );
    }

    const existingDebt: any = await prisma.debt.findUnique({ where: { id } });
    if (!existingDebt) {
      return NextResponse.json(
        { success: false, error: "Deuda no encontrada." },
        { status: 404 }
      );
    }

    // ACTION 1: PAY (Abonar / Cobrar vinculado a una cuenta)
    if (action === "PAY") {
      const amt = parseFloat(String(paymentAmount));
      if (!amt || amt <= 0) {
        return NextResponse.json(
          { success: false, error: "El monto del abono debe ser mayor a 0." },
          { status: 400 }
        );
      }

      if (!accountId) {
        return NextResponse.json(
          { success: false, error: "Selecciona la cuenta para aplicar el abono." },
          { status: 400 }
        );
      }

      const updated = await prisma.$transaction(async (tx) => {
        const isIOwe = existingDebt.type === DebtType.I_OWE;
        const txType = isIOwe ? TransactionType.EXPENSE : TransactionType.INCOME;
        const catType = isIOwe ? CategoryType.EXPENSE : CategoryType.INCOME;

        let category = await tx.category.findFirst({
          where: { type: catType },
        });

        if (!category) {
          category = await tx.category.create({
            data: {
              name: isIOwe ? "Abono de Deudas" : "Cobro de Préstamos",
              type: catType,
              icon: "HandCoins",
              color: isIOwe ? "#f43f5e" : "#10b981",
            },
          });
        }

        await tx.transaction.create({
          data: {
            amount: amt,
            type: txType,
            date: new Date(),
            note:
              paymentNote?.trim() ||
              (isIOwe
                ? `Abono a deuda: ${existingDebt.title}`
                : `Cobro de préstamo: ${existingDebt.title}`),
            accountId,
            categoryId: category.id,
            debtId: existingDebt.id,
          },
        });

        if (isIOwe) {
          await tx.account.update({
            where: { id: accountId },
            data: { balance: { decrement: amt } },
          });
        } else {
          await tx.account.update({
            where: { id: accountId },
            data: { balance: { increment: amt } },
          });
        }

        const newPaid = Math.min(
          existingDebt.totalAmount,
          existingDebt.paidAmount + amt
        );
        const newStatus =
          newPaid >= existingDebt.totalAmount ? DebtStatus.PAID : DebtStatus.ACTIVE;

        const currentRem = existingDebt.remainingInstallments;
        const nextRem =
          currentRem && currentRem > 0
            ? newStatus === DebtStatus.PAID
              ? 0
              : Math.max(1, currentRem - 1)
            : null;

        return (tx.debt as any).update({
          where: { id },
          data: {
            paidAmount: newPaid,
            remainingInstallments: nextRem,
            status: newStatus,
          },
          include: {
            account: true,
            transactions: {
              orderBy: { date: "desc" },
              include: { account: true },
            },
          },
        });
      });

      return NextResponse.json({ success: true, data: updated });
    }

    // ACTION 2: SETTLE
    if (action === "SETTLE") {
      const remaining = Math.max(0, existingDebt.totalAmount - existingDebt.paidAmount);

      const settled = await prisma.$transaction(async (tx) => {
        if (accountId && remaining > 0) {
          const isIOwe = existingDebt.type === DebtType.I_OWE;
          const txType = isIOwe ? TransactionType.EXPENSE : TransactionType.INCOME;
          const catType = isIOwe ? CategoryType.EXPENSE : CategoryType.INCOME;

          let category = await tx.category.findFirst({ where: { type: catType } });
          if (!category) {
            category = await tx.category.create({
              data: {
                name: isIOwe ? "Liquidación de Deuda" : "Liquidación de Préstamo",
                type: catType,
                icon: "HandCoins",
                color: "#10b981",
              },
            });
          }

          await tx.transaction.create({
            data: {
              amount: remaining,
              type: txType,
              date: new Date(),
              note: `Liquidación total: ${existingDebt.title}`,
              accountId,
              categoryId: category.id,
              debtId: existingDebt.id,
            },
          });

          if (isIOwe) {
            await tx.account.update({
              where: { id: accountId },
              data: { balance: { decrement: remaining } },
            });
          } else {
            await tx.account.update({
              where: { id: accountId },
              data: { balance: { increment: remaining } },
            });
          }
        }

        return (tx.debt as any).update({
          where: { id },
          data: {
            paidAmount: existingDebt.totalAmount,
            remainingInstallments: 0,
            status: DebtStatus.PAID,
          },
          include: {
            account: true,
            transactions: {
              orderBy: { date: "desc" },
              include: { account: true },
            },
          },
        });
      });

      return NextResponse.json({ success: true, data: settled });
    }

    // ACTION 3: EDIT
    const updateData: any = {};
    if (title !== undefined && title.trim()) updateData.title = title.trim();
    if (counterparty !== undefined) {
      updateData.counterparty = counterparty ? String(counterparty).trim() : null;
    }
    if (type !== undefined) {
      updateData.type = type === "THEY_OWE" ? DebtType.THEY_OWE : DebtType.I_OWE;
    }
    if (totalAmount !== undefined) {
      updateData.totalAmount = parseFloat(String(totalAmount));
    }
    if (paidAmount !== undefined) {
      updateData.paidAmount = parseFloat(String(paidAmount));
    }
    if (dueDate !== undefined) {
      updateData.dueDate = dueDate ? new Date(dueDate) : null;
    }
    if (installments !== undefined) {
      updateData.installments = installments ? parseInt(String(installments), 10) : null;
    }
    if (remainingInstallments !== undefined) {
      updateData.remainingInstallments = remainingInstallments
        ? parseInt(String(remainingInstallments), 10)
        : null;
    }
    if (monthlyPayment !== undefined) {
      updateData.monthlyPayment = monthlyPayment
        ? parseFloat(String(monthlyPayment))
        : null;
    }
    if (notes !== undefined) {
      updateData.notes = notes ? String(notes).trim() : null;
    }

    const finalTotal =
      updateData.totalAmount !== undefined
        ? updateData.totalAmount
        : existingDebt.totalAmount;
    const finalPaid =
      updateData.paidAmount !== undefined
        ? updateData.paidAmount
        : existingDebt.paidAmount;

    if (status !== undefined) {
      updateData.status = status === "PAID" ? DebtStatus.PAID : DebtStatus.ACTIVE;
    } else {
      updateData.status = finalPaid >= finalTotal ? DebtStatus.PAID : DebtStatus.ACTIVE;
    }

    const updatedDebt = await (prisma.debt as any).update({
      where: { id },
      data: updateData,
      include: {
        account: true,
        transactions: {
          orderBy: { date: "desc" },
          include: { account: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: updatedDebt });
  } catch (error: any) {
    console.error("API PATCH /api/debts Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al actualizar la deuda." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID de deuda requerido." },
        { status: 400 }
      );
    }

    await prisma.debt.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Deuda eliminada. Los registros históricos de transacciones se conservaron.",
    });
  } catch (error: any) {
    console.error("API DELETE /api/debts Error:", error);
    return NextResponse.json(
      { success: false, error: "Error al eliminar la deuda." },
      { status: 500 }
    );
  }
}
