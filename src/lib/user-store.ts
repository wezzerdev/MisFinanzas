import prisma from "./db";
import crypto from "crypto";

export interface UserRecord {
  id: string;
  email: string;
  name: string | null;
  passwordHash: string;
  emailVerified: boolean;
  verificationToken: string | null;
  resetToken: string | null;
  resetTokenExpiry: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Respaldo en memoria persistente durante el ciclo de vida del servidor si la tabla aún no se ha migrado
const memoryUsers = new Map<string, UserRecord>();

export function hashPassword(password: string): string {
  const salt = "finanzas_salt_v1";
  return crypto.scryptSync(password, salt, 32).toString("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  const computed = hashPassword(password);
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Asegura la existencia de la tabla User en PostgreSQL
 */
async function ensureUserTable() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "public"."User" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "email" TEXT NOT NULL UNIQUE,
        "name" TEXT,
        "passwordHash" TEXT NOT NULL,
        "emailVerified" BOOLEAN NOT NULL DEFAULT true,
        "verificationToken" TEXT UNIQUE,
        "resetToken" TEXT UNIQUE,
        "resetTokenExpiry" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    // Confirmar automáticamente cualquier cuenta existente para evitar bloqueos
    await prisma.$executeRawUnsafe(`
      UPDATE "public"."User" SET "emailVerified" = true WHERE "emailVerified" = false;
    `);
  } catch (err) {
    // Si falla por permisos o conexión, se ignora y se procede con Prisma o memoria
  }
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const cleanEmail = email.trim().toLowerCase();

  try {
    const user = await (prisma as any).user.findUnique({
      where: { email: cleanEmail },
    });
    if (user) return user as UserRecord;
  } catch (err: any) {
    if (err?.code === "P2021" || String(err).includes("does not exist")) {
      await ensureUserTable();
      try {
        const user = await (prisma as any).user.findUnique({
          where: { email: cleanEmail },
        });
        if (user) return user as UserRecord;
      } catch {
        // Usa memoria como fallback
      }
    }
  }

  return memoryUsers.get(cleanEmail) || null;
}

export async function autoConfirmUser(email: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  try {
    await (prisma as any).user.update({
      where: { email: cleanEmail },
      data: { emailVerified: true, verificationToken: null },
    });
  } catch {}
  const mem = memoryUsers.get(cleanEmail);
  if (mem) {
    mem.emailVerified = true;
    mem.verificationToken = null;
    mem.updatedAt = new Date();
  }
}

export async function createUser(data: {
  email: string;
  name?: string;
  password: string;
  verificationToken?: string;
}): Promise<UserRecord> {
  const cleanEmail = data.email.trim().toLowerCase();
  const userName = data.name?.trim() || cleanEmail.split("@")[0];
  const passwordHash = hashPassword(data.password);
  const now = new Date();

  const record: UserRecord = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    email: cleanEmail,
    name: userName,
    passwordHash,
    emailVerified: true, // Confirmación automática inmediata
    verificationToken: null,
    resetToken: null,
    resetTokenExpiry: null,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const created = await (prisma as any).user.create({
      data: {
        id: record.id,
        email: record.email,
        name: record.name,
        passwordHash: record.passwordHash,
        emailVerified: true,
        verificationToken: null,
      },
    });
    return created as UserRecord;
  } catch (err: any) {
    if (err?.code === "P2021" || String(err).includes("does not exist")) {
      await ensureUserTable();
      try {
        const created = await (prisma as any).user.create({
          data: {
            id: record.id,
            email: record.email,
            name: record.name,
            passwordHash: record.passwordHash,
            emailVerified: true,
            verificationToken: null,
          },
        });
        return created as UserRecord;
      } catch {
        // Fallback a memoria
      }
    }
  }

  memoryUsers.set(cleanEmail, record);
  return record;
}

export async function verifyUserEmail(token: string): Promise<UserRecord | null> {
  if (!token || !token.trim()) return null;
  const cleanToken = token.trim();

  try {
    const user = await (prisma as any).user.findFirst({
      where: { verificationToken: cleanToken },
    });

    if (user) {
      const updated = await (prisma as any).user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          verificationToken: null,
        },
      });
      return updated as UserRecord;
    }
  } catch (err) {
    // Buscar en memoria
  }

  for (const [email, user] of memoryUsers.entries()) {
    if (user.verificationToken === cleanToken) {
      user.emailVerified = true;
      user.verificationToken = null;
      user.updatedAt = new Date();
      memoryUsers.set(email, user);
      return user;
    }
  }

  return null;
}

export async function updateVerificationToken(
  email: string,
  newToken: string
): Promise<UserRecord | null> {
  const cleanEmail = email.trim().toLowerCase();

  try {
    const updated = await (prisma as any).user.update({
      where: { email: cleanEmail },
      data: {
        verificationToken: newToken,
      },
    });
    return updated as UserRecord;
  } catch {
    const user = memoryUsers.get(cleanEmail);
    if (user) {
      user.verificationToken = newToken;
      user.updatedAt = new Date();
      memoryUsers.set(cleanEmail, user);
      return user;
    }
  }

  return null;
}

export async function setPasswordResetToken(
  email: string,
  token: string,
  expiry: Date
): Promise<UserRecord | null> {
  const cleanEmail = email.trim().toLowerCase();

  try {
    const updated = await (prisma as any).user.update({
      where: { email: cleanEmail },
      data: {
        resetToken: token,
        resetTokenExpiry: expiry,
      },
    });
    return updated as UserRecord;
  } catch {
    const user = memoryUsers.get(cleanEmail);
    if (user) {
      user.resetToken = token;
      user.resetTokenExpiry = expiry;
      user.updatedAt = new Date();
      memoryUsers.set(cleanEmail, user);
      return user;
    }
  }

  return null;
}

export async function resetPasswordWithToken(
  token: string,
  newPassword: string
): Promise<UserRecord | null> {
  if (!token || !token.trim()) return null;
  const cleanToken = token.trim();
  const passwordHash = hashPassword(newPassword);

  try {
    const user = await (prisma as any).user.findFirst({
      where: {
        resetToken: cleanToken,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (user) {
      const updated = await (prisma as any).user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          resetToken: null,
          resetTokenExpiry: null,
          emailVerified: true, // Si recuperó su contraseña por correo, valida el correo automáticamente
        },
      });
      return updated as UserRecord;
    }
  } catch {
    // Buscar en memoria
  }

  for (const [email, user] of memoryUsers.entries()) {
    if (
      user.resetToken === cleanToken &&
      user.resetTokenExpiry &&
      user.resetTokenExpiry > new Date()
    ) {
      user.passwordHash = passwordHash;
      user.resetToken = null;
      user.resetTokenExpiry = null;
      user.emailVerified = true;
      user.updatedAt = new Date();
      memoryUsers.set(email, user);
      return user;
    }
  }

  return null;
}
