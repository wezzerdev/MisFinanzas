import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import {
  TransactionType,
  DebtType,
  DebtStatus,
  RecurrenceFrequency,
  CategoryType,
} from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("accountId");
    const categoryId = searchParams.get("categoryId");
    const type = searchParams.get("type") as TransactionType | null;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!, 10)
      : undefined;

    const where: any = {};

    if (accountId) {
      where.OR = [{ accountId }, { destinationAccountId: accountId }];
    }
    if (categoryId) where.categoryId = categoryId;
    if (type) where.type = type;

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { date: "desc" },
      take: limit,
      include: {
        account: true,
        category: true,
        debt: true,
      },
    });

    return NextResponse.json({ success: true, data: transactions });
  } catch (error: any) {
    console.error("API GET /api/transactions Error:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener las transacciones." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      amount,
      type,
      date,
      note,
      receiptUrl,
      accountId,
      destinationAccountId,
      categoryId,
      isRecurring = false,
      debtId,
      // 1. MSI & Financing
      isMsi = false,
      installments = 1,
      remainingInstallments,
      pendingAmount,
      isRetroactive = false,
      // 2. Deuda / Préstamo
      isLoan = false,
      loanType = "I_OWE",
      counterparty,
      dueDate,
    } = body;

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json(
        { success: false, error: "El monto debe ser un número positivo." },
        { status: 400 }
      );
    }

    if (!type || !["INCOME", "EXPENSE", "TRANSFER"].includes(type)) {
      return NextResponse.json(
        { success: false, error: "Tipo de transacción inválido." },
        { status: 400 }
      );
    }

    if (!accountId) {
      return NextResponse.json(
        { success: false, error: "Debe seleccionar una cuenta de origen." },
        { status: 400 }
      );
    }

    if (type === "TRANSFER" && !destinationAccountId) {
      return NextResponse.json(
        {
          success: false,
          error: "Debe seleccionar una cuenta de destino para el traspaso.",
        },
        { status: 400 }
      );
    }

    if (type === "TRANSFER" && accountId === destinationAccountId) {
      return NextResponse.json(
        {
          success: false,
          error: "La cuenta de origen y destino no pueden ser la misma.",
        },
        { status: 400 }
      );
    }

    const parsedAmount = parseFloat(String(amount));
    const parsedDate = date ? new Date(date) : new Date();
    const numMonths = Math.max(1, parseInt(String(installments || 1), 10));
    const remMonths =
      remainingInstallments !== undefined && remainingInstallments !== null
        ? Math.max(1, Math.min(numMonths, parseInt(String(remainingInstallments), 10)))
        : numMonths;

    // Calculate backlog / retroactive numbers accurately
    const isRetro = Boolean(isRetroactive) && (isMsi || isLoan);
    const effectiveRemainingBalance =
      isRetro && pendingAmount && Number(pendingAmount) > 0
        ? parseFloat(String(pendingAmount))
        : isRetro && numMonths > 0
        ? Number(((parsedAmount / numMonths) * remMonths).toFixed(2))
        : parsedAmount;

    const alreadyPaidAmount = isRetro
      ? Math.max(0, Number((parsedAmount - effectiveRemainingBalance).toFixed(2)))
      : 0;

    const monthlyPayment =
      remMonths > 0
        ? Number((effectiveRemainingBalance / remMonths).toFixed(2))
        : parsedAmount;

    const createdTransaction = await prisma.$transaction(async (tx) => {
      let finalDebtId = debtId || null;

      // Ensure a valid category exists if none was provided
      let resolvedCategoryId = categoryId;
      if (!resolvedCategoryId) {
        const fallbackType =
          type === "INCOME" ? CategoryType.INCOME : CategoryType.EXPENSE;
        let fallbackCat = await tx.category.findFirst({
          where: { type: fallbackType },
        });
        if (!fallbackCat) {
          fallbackCat = await tx.category.create({
            data: {
              name: type === "INCOME" ? "Ingresos Generales" : "Gastos Generales",
              type: fallbackType,
              icon: "Tag",
              color: type === "INCOME" ? "#10b981" : "#009fdb",
            },
          });
        }
        resolvedCategoryId = fallbackCat.id;
      }

      const nextMonth = new Date(parsedDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      // CASE A: Compra con Tarjeta de Crédito (MSI / Plazos)
      if (type === "EXPENSE" && isMsi && !isLoan) {
        const createdMsiDebt = await (tx.debt as any).create({
          data: {
            title:
              numMonths > 1
                ? `${note || "Compra a plazos"} (${remMonths}/${numMonths} MSI)`
                : `${note || "Cargo Tarjeta"} (Pago único)`,
            counterparty: counterparty
              ? String(counterparty).trim()
              : "Tarjeta de Crédito",
            type: DebtType.I_OWE,
            totalAmount: parsedAmount,
            paidAmount: alreadyPaidAmount,
            dueDate: dueDate ? new Date(dueDate) : nextMonth,
            isMsi: true,
            installments: numMonths,
            remainingInstallments: remMonths,
            monthlyPayment,
            accountId,
            notes: isRetro
              ? `Registro retroactivo: restan ${remMonths} de ${numMonths} meses ($${monthlyPayment}/mes)`
              : numMonths > 1
              ? `Plan de ${numMonths} meses sin intereses de $${monthlyPayment}/mes`
              : `Pago único al próximo corte ($${parsedAmount})`,
            status: DebtStatus.ACTIVE,
          },
        });
        finalDebtId = createdMsiDebt.id;

        if (numMonths > 1) {
          await tx.recurringRule.create({
            data: {
              amount: monthlyPayment,
              type: TransactionType.EXPENSE,
              frequency: RecurrenceFrequency.MONTHLY,
              nextRun: nextMonth,
              accountId,
              categoryId: resolvedCategoryId,
            },
          });
        }
      }

      // CASE B: Deuda / Préstamo (Personal, Bancario o Financiamiento directo)
      if (isLoan) {
        const mappedDebtType =
          loanType === "THEY_OWE" ? DebtType.THEY_OWE : DebtType.I_OWE;

        const createdPersonalDebt = await (tx.debt as any).create({
          data: {
            title:
              note?.trim() ||
              (mappedDebtType === DebtType.I_OWE
                ? `Deuda: ${counterparty || "Acreedor"}`
                : `Préstamo a ${counterparty || "Deudor"}`),
            counterparty: counterparty ? String(counterparty).trim() : null,
            type: mappedDebtType,
            totalAmount: parsedAmount,
            paidAmount: alreadyPaidAmount,
            dueDate: dueDate ? new Date(dueDate) : nextMonth,
            isMsi: false,
            installments: numMonths,
            remainingInstallments: remMonths,
            monthlyPayment,
            accountId,
            notes: isRetro
              ? `Saldo pendiente anterior: restan ${remMonths} de ${numMonths} pagos ($${monthlyPayment}/mes)`
              : numMonths > 1
              ? `Financiamiento a ${numMonths} plazos de $${monthlyPayment}/mes`
              : "Pago único",
            status: DebtStatus.ACTIVE,
          },
        });
        finalDebtId = createdPersonalDebt.id;
      }

      // Create RecurringRule if user explicitly enabled Movimiento Recurrente (and not already created above)
      if (isRecurring && !(type === "EXPENSE" && isMsi && !isLoan && numMonths > 1)) {
        await tx.recurringRule.create({
          data: {
            amount: isMsi || isLoan ? monthlyPayment : parsedAmount,
            type:
              type === "INCOME"
                ? TransactionType.INCOME
                : TransactionType.EXPENSE,
            frequency: RecurrenceFrequency.MONTHLY,
            nextRun: nextMonth,
            accountId,
            categoryId: resolvedCategoryId,
          },
        });
      }

      // 1. Create Transaction record
      // For retroactive purchases, we record effectiveRemainingBalance so cashflow is not distorted
      const txAmountToRecord = isRetro ? effectiveRemainingBalance : parsedAmount;

      const transaction = await (tx.transaction as any).create({
        data: {
          amount: txAmountToRecord,
          type: type as TransactionType,
          date: parsedDate,
          note: note ? String(note).trim() : null,
          receiptUrl: receiptUrl || null,
          accountId,
          destinationAccountId: destinationAccountId || null,
          categoryId: resolvedCategoryId,
          isRecurring: Boolean(isRecurring),
          installments: isMsi || isLoan ? numMonths : null,
          remainingInstallments: isMsi || isLoan ? remMonths : null,
          monthlyAmount: isMsi || isLoan ? monthlyPayment : null,
          isRetroactive: isRetro,
          debtId: finalDebtId,
        },
        include: {
          account: true,
          category: true,
          debt: true,
        },
      });

      // 2. Adjust Account Balances
      if (type === "INCOME") {
        await tx.account.update({
          where: { id: accountId },
          data: { balance: { increment: txAmountToRecord } },
        });
      } else if (type === "EXPENSE") {
        await tx.account.update({
          where: { id: accountId },
          data: { balance: { decrement: txAmountToRecord } },
        });
      } else if (type === "TRANSFER" && destinationAccountId) {
        await tx.account.update({
          where: { id: accountId },
          data: { balance: { decrement: txAmountToRecord } },
        });
        await tx.account.update({
          where: { id: destinationAccountId },
          data: { balance: { increment: txAmountToRecord } },
        });
      }

      // 3. If paying/collecting an existing debt, update debt progress
      if (debtId && !isMsi && !isLoan) {
        const debt = await tx.debt.findUnique({ where: { id: debtId } });
        if (debt) {
          const newPaidAmount = Math.min(
            debt.totalAmount,
            debt.paidAmount + parsedAmount
          );
          const isFullyPaid = newPaidAmount >= debt.totalAmount;

          await tx.debt.update({
            where: { id: debtId },
            data: {
              paidAmount: newPaidAmount,
              status: isFullyPaid ? DebtStatus.PAID : DebtStatus.ACTIVE,
            },
          });
        }
      }

      return transaction;
    });

    return NextResponse.json(
      { success: true, data: createdTransaction },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("API POST /api/transactions Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error al crear la transacción.",
      },
      { status: 500 }
    );
  }
}
