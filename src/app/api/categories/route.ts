import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { CategoryType } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const withCount = searchParams.get("withCount") === "true";

    let categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: withCount
        ? {
            _count: {
              select: { transactions: true },
            },
          }
        : undefined,
    });

    // Seed standard categories if empty
    if (categories.length === 0) {
      await prisma.category.createMany({
        data: [
          { name: "Alimentación & Super", type: CategoryType.EXPENSE, icon: "ShoppingCart", color: "#f59e0b" },
          { name: "Vivienda & Servicios", type: CategoryType.EXPENSE, icon: "Home", color: "#3b82f6" },
          { name: "Transporte & Gasolina", type: CategoryType.EXPENSE, icon: "Car", color: "#6366f1" },
          { name: "Salud & Bienestar", type: CategoryType.EXPENSE, icon: "HeartPulse", color: "#ef4444" },
          { name: "Entretenimiento", type: CategoryType.EXPENSE, icon: "Film", color: "#ec4899" },
          { name: "Suscripciones", type: CategoryType.EXPENSE, icon: "Repeat", color: "#8b5cf6" },
          { name: "Salario / Nómina", type: CategoryType.INCOME, icon: "Briefcase", color: "#10b981" },
          { name: "Rendimientos / Inversión", type: CategoryType.INCOME, icon: "TrendingUp", color: "#14b8a6" },
          { name: "Ventas / Freelance", type: CategoryType.INCOME, icon: "Laptop", color: "#06b6d4" },
          { name: "Otros Gastos", type: CategoryType.EXPENSE, icon: "Tag", color: "#94a3b8" },
        ],
      });
      categories = await prisma.category.findMany({
        orderBy: { name: "asc" },
        include: withCount
          ? {
              _count: {
                select: { transactions: true },
              },
            }
          : undefined,
      });
    }

    return NextResponse.json({ success: true, data: categories });
  } catch (error: any) {
    console.error("API GET /api/categories Error:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener categorías." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, type, icon = "Tag", color = "#3b82f6" } = await req.json();
    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "El nombre de la categoría es requerido." },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        type: type === "INCOME" ? CategoryType.INCOME : CategoryType.EXPENSE,
        icon,
        color,
      },
    });

    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error: any) {
    console.error("API POST /api/categories Error:", error);
    return NextResponse.json(
      { success: false, error: "Error al crear categoría." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const body = await req.json();
    const id = searchParams.get("id") || body.id;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID de categoría requerido." },
        { status: 400 }
      );
    }

    const { name, type, icon, color } = body;
    const updateData: any = {};

    if (name !== undefined && name.trim()) updateData.name = name.trim();
    if (type !== undefined) {
      updateData.type = type === "INCOME" ? CategoryType.INCOME : CategoryType.EXPENSE;
    }
    if (icon !== undefined) updateData.icon = icon;
    if (color !== undefined) updateData.color = color;

    const updated = await prisma.category.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("API PATCH /api/categories Error:", error);
    return NextResponse.json(
      { success: false, error: "Error al actualizar categoría." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const reassignTo = searchParams.get("reassignTo");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID de categoría requerido." },
        { status: 400 }
      );
    }

    const txCount = await prisma.transaction.count({
      where: { categoryId: id },
    });

    if (txCount > 0 && !reassignTo) {
      return NextResponse.json(
        {
          success: false,
          error: `Esta categoría tiene ${txCount} movimientos asociados. Selecciona una categoría destino para reasignarlos.`,
        },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      if (txCount > 0 && reassignTo) {
        await tx.transaction.updateMany({
          where: { categoryId: id },
          data: { categoryId: reassignTo },
        });
      }

      // Remove recurring rules tied to this category or reassign if possible
      if (reassignTo) {
        await tx.recurringRule.updateMany({
          where: { categoryId: id },
          data: { categoryId: reassignTo },
        });
      } else {
        await tx.recurringRule.deleteMany({
          where: { categoryId: id },
        });
      }

      await tx.category.delete({
        where: { id },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API DELETE /api/categories Error:", error);
    return NextResponse.json(
      { success: false, error: "Error al eliminar categoría." },
      { status: 500 }
    );
  }
}
