import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { AccountType } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includeArchived = searchParams.get("includeArchived") === "true";

    const where: any = {};
    if (!includeArchived) {
      where.isArchived = false;
    }

    const accounts = await prisma.account.findMany({
      where,
      orderBy: { createdAt: "asc" },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: accounts });
  } catch (error: any) {
    console.error("API GET /api/accounts Error:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener cuentas." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      type,
      balance = 0,
      currency = "MXN",
      color = "#009fdb",
      bankLogo = "BBVA",
      cardLast4,
      creditLimit,
      cutoffDay,
      paymentDueDay,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "El nombre de la cuenta es requerido." },
        { status: 400 }
      );
    }

    const createData: any = {
      name: name.trim(),
      type: type || AccountType.DEBIT,
      balance: parseFloat(String(balance)) || 0.0,
      currency,
      color: color || "#009fdb",
      bankLogo: bankLogo || "BBVA",
      cardLast4: cardLast4 ? String(cardLast4).trim().slice(-4) : null,
      isArchived: false,
      creditLimit:
        creditLimit !== undefined && creditLimit !== null && creditLimit !== ""
          ? parseFloat(String(creditLimit))
          : null,
      cutoffDay:
        cutoffDay !== undefined && cutoffDay !== null && cutoffDay !== ""
          ? Math.min(31, Math.max(1, parseInt(String(cutoffDay), 10)))
          : null,
      paymentDueDay:
        paymentDueDay !== undefined &&
        paymentDueDay !== null &&
        paymentDueDay !== ""
          ? Math.min(31, Math.max(1, parseInt(String(paymentDueDay), 10)))
          : null,
    };

    const newAccount = await (prisma.account as any).create({
      data: createData,
    });

    return NextResponse.json({ success: true, data: newAccount }, { status: 201 });
  } catch (error: any) {
    console.error("API POST /api/accounts Error:", error);
    return NextResponse.json(
      { success: false, error: "Error al crear la cuenta." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      name,
      type,
      balance,
      currency,
      color,
      bankLogo,
      cardLast4,
      isArchived,
      creditLimit,
      cutoffDay,
      paymentDueDay,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "El ID de la cuenta es requerido." },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (type !== undefined) updateData.type = type;
    if (balance !== undefined) updateData.balance = parseFloat(String(balance));
    if (currency !== undefined) updateData.currency = currency;
    if (color !== undefined) updateData.color = color;
    if (bankLogo !== undefined) updateData.bankLogo = bankLogo;
    if (cardLast4 !== undefined) {
      updateData.cardLast4 = cardLast4 ? String(cardLast4).trim().slice(-4) : null;
    }
    if (isArchived !== undefined) updateData.isArchived = Boolean(isArchived);
    if (creditLimit !== undefined) {
      updateData.creditLimit =
        creditLimit === null || creditLimit === ""
          ? null
          : parseFloat(String(creditLimit));
    }
    if (cutoffDay !== undefined) {
      updateData.cutoffDay =
        cutoffDay === null || cutoffDay === ""
          ? null
          : Math.min(31, Math.max(1, parseInt(String(cutoffDay), 10)));
    }
    if (paymentDueDay !== undefined) {
      updateData.paymentDueDay =
        paymentDueDay === null || paymentDueDay === ""
          ? null
          : Math.min(31, Math.max(1, parseInt(String(paymentDueDay), 10)));
    }

    const updated = await (prisma.account as any).update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("API PATCH /api/accounts Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al actualizar la cuenta." },
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
        { success: false, error: "ID de cuenta requerido." },
        { status: 400 }
      );
    }

    await prisma.account.update({
      where: { id },
      data: { isArchived: true },
    });

    return NextResponse.json({ success: true, message: "Cuenta archivada." });
  } catch (error: any) {
    console.error("API DELETE /api/accounts Error:", error);
    return NextResponse.json(
      { success: false, error: "Error al eliminar la cuenta." },
      { status: 500 }
    );
  }
}
