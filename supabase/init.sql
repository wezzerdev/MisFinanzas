-- =============================================================================
-- FINANZAS PWA - SUPABASE (POSTGRESQL) INITIALIZATION SCRIPT
-- Estado Inicial Limpio ($0.00 en cuentas, movimientos y deudas)
-- =============================================================================

-- 1. LIMPIEZA PREVIA (Idempotente para reiniciar el esquema desde cero)
DROP TABLE IF EXISTS "public"."Transaction" CASCADE;
DROP TABLE IF EXISTS "public"."RecurringRule" CASCADE;
DROP TABLE IF EXISTS "public"."Debt" CASCADE;
DROP TABLE IF EXISTS "public"."Account" CASCADE;
DROP TABLE IF EXISTS "public"."Category" CASCADE;

DROP TYPE IF EXISTS "public"."AccountType" CASCADE;
DROP TYPE IF EXISTS "public"."CategoryType" CASCADE;
DROP TYPE IF EXISTS "public"."TransactionType" CASCADE;
DROP TYPE IF EXISTS "public"."DebtType" CASCADE;
DROP TYPE IF EXISTS "public"."DebtStatus" CASCADE;
DROP TYPE IF EXISTS "public"."RecurrenceFrequency" CASCADE;

-- 2. CREACIÓN DE ENUMS NATIVOS DE POSTGRESQL
CREATE TYPE "public"."AccountType" AS ENUM ('CASH', 'DEBIT', 'CREDIT', 'SAVINGS');
CREATE TYPE "public"."CategoryType" AS ENUM ('INCOME', 'EXPENSE');
CREATE TYPE "public"."TransactionType" AS ENUM ('INCOME', 'EXPENSE', 'TRANSFER');
CREATE TYPE "public"."DebtType" AS ENUM ('I_OWE', 'THEY_OWE');
CREATE TYPE "public"."DebtStatus" AS ENUM ('ACTIVE', 'PAID');
CREATE TYPE "public"."RecurrenceFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- 3. TABLA: Account (Cuentas, Tarjetas de Débito/Crédito, Efectivo y Ahorros)
CREATE TABLE "public"."Account" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."AccountType" NOT NULL DEFAULT 'DEBIT',
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "creditLimit" DOUBLE PRECISION,
    "cutoffDay" INTEGER,
    "paymentDueDay" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'MXN',
    "color" TEXT DEFAULT '#009fdb',
    "bankLogo" TEXT DEFAULT 'BBVA',
    "cardLast4" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- 4. TABLA: Category (Categorías con iconos Lucide y colores)
CREATE TABLE "public"."Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."CategoryType" NOT NULL DEFAULT 'EXPENSE',
    "icon" TEXT NOT NULL DEFAULT 'Tag',
    "color" TEXT NOT NULL DEFAULT '#009fdb',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- 5. TABLA: Debt (Módulo Unificado de Deudas Personales y MSI)
CREATE TABLE "public"."Debt" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "counterparty" TEXT,
    "type" "public"."DebtType" NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "dueDate" TIMESTAMP(3),
    "isMsi" BOOLEAN NOT NULL DEFAULT false,
    "installments" INTEGER,
    "remainingInstallments" INTEGER,
    "monthlyPayment" DOUBLE PRECISION,
    "accountId" TEXT,
    "notes" TEXT,
    "status" "public"."DebtStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Debt_pkey" PRIMARY KEY ("id")
);

-- 6. TABLA: Transaction (Movimientos: Gastos, Ingresos y Traspasos)
CREATE TABLE "public"."Transaction" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "public"."TransactionType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "receiptUrl" TEXT,
    "accountId" TEXT NOT NULL,
    "destinationAccountId" TEXT,
    "categoryId" TEXT NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "installments" INTEGER,
    "remainingInstallments" INTEGER,
    "monthlyAmount" DOUBLE PRECISION,
    "isRetroactive" BOOLEAN NOT NULL DEFAULT false,
    "debtId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- 7. TABLA: RecurringRule (Reglas de Pagos/Ingresos Recurrentes)
CREATE TABLE "public"."RecurringRule" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "public"."TransactionType" NOT NULL,
    "frequency" "public"."RecurrenceFrequency" NOT NULL DEFAULT 'MONTHLY',
    "nextRun" TIMESTAMP(3) NOT NULL,
    "accountId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecurringRule_pkey" PRIMARY KEY ("id")
);

-- 7. TABLA: User (Control de Usuarios, Bóvedas Cifradas y Verificación de Correo)
CREATE TABLE IF NOT EXISTS "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "User_email_key" UNIQUE ("email"),
    CONSTRAINT "User_verificationToken_key" UNIQUE ("verificationToken"),
    CONSTRAINT "User_resetToken_key" UNIQUE ("resetToken")
);

-- 8. ÍNDICES DE RENDIMIENTO
CREATE INDEX "Transaction_date_idx" ON "public"."Transaction"("date");
CREATE INDEX "Transaction_accountId_idx" ON "public"."Transaction"("accountId");
CREATE INDEX "Transaction_categoryId_idx" ON "public"."Transaction"("categoryId");
CREATE INDEX "Transaction_debtId_idx" ON "public"."Transaction"("debtId");

-- 9. LLAVES FORÁNEAS (RELACIONES E INTEGRIDAD REFERENCIAL)
ALTER TABLE "public"."Debt"
    ADD CONSTRAINT "Debt_accountId_fkey"
    FOREIGN KEY ("accountId") REFERENCES "public"."Account"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "public"."Transaction"
    ADD CONSTRAINT "Transaction_accountId_fkey"
    FOREIGN KEY ("accountId") REFERENCES "public"."Account"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."Transaction"
    ADD CONSTRAINT "Transaction_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."Transaction"
    ADD CONSTRAINT "Transaction_debtId_fkey"
    FOREIGN KEY ("debtId") REFERENCES "public"."Debt"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "public"."RecurringRule"
    ADD CONSTRAINT "RecurringRule_accountId_fkey"
    FOREIGN KEY ("accountId") REFERENCES "public"."Account"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."RecurringRule"
    ADD CONSTRAINT "RecurringRule_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- 10. TRIGGER AUTOMÁTICO PARA updatedAt EN TODAS LAS TABLAS
CREATE OR REPLACE FUNCTION "public"."set_current_timestamp_updated_at"()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "set_Account_updatedAt"
BEFORE UPDATE ON "public"."Account"
FOR EACH ROW EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();

CREATE TRIGGER "set_Category_updatedAt"
BEFORE UPDATE ON "public"."Category"
FOR EACH ROW EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();

CREATE TRIGGER "set_Debt_updatedAt"
BEFORE UPDATE ON "public"."Debt"
FOR EACH ROW EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();

CREATE TRIGGER "set_Transaction_updatedAt"
BEFORE UPDATE ON "public"."Transaction"
FOR EACH ROW EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();

CREATE TRIGGER "set_RecurringRule_updatedAt"
BEFORE UPDATE ON "public"."RecurringRule"
FOR EACH ROW EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();

-- 11. CATÁLOGO BASE DE CATEGORÍAS (Cero cuentas, cero movimientos y cero deudas)
INSERT INTO "public"."Category" ("id", "name", "type", "icon", "color", "createdAt", "updatedAt") VALUES
  ('cat_alimentacion', 'Alimentación & Super', 'EXPENSE', 'ShoppingCart', '#f59e0b', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat_vivienda', 'Vivienda & Servicios', 'EXPENSE', 'Home', '#009fdb', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat_transporte', 'Transporte & Gasolina', 'EXPENSE', 'Car', '#6366f1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat_salud', 'Salud & Bienestar', 'EXPENSE', 'HeartPulse', '#ef4444', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat_entretenimiento', 'Entretenimiento', 'EXPENSE', 'Film', '#ec4899', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat_suscripciones', 'Suscripciones', 'EXPENSE', 'Repeat', '#8b5cf6', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat_otros_gastos', 'Otros Gastos', 'EXPENSE', 'Tag', '#94a3b8', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat_salario', 'Salario / Nómina', 'INCOME', 'Briefcase', '#10b981', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat_rendimientos', 'Rendimientos / Inversión', 'INCOME', 'TrendingUp', '#14b8a6', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cat_ventas', 'Ventas / Freelance', 'INCOME', 'Laptop', '#06b6d4', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 12. PERMISOS PARA ROLES DE SUPABASE
GRANT USAGE ON SCHEMA "public" TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA "public" TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA "public" TO postgres, anon, authenticated, service_role;
