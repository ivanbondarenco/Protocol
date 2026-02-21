import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'];

const registerSchema = z.object({
  email: z.string().email('Formato de email invalido.'),
  password: z.string().min(6, 'La contrasena debe tener al menos 6 caracteres.'),
  name: z.string().optional(),
  username: z.string().min(3).max(30).optional(),
});

const loginSchema = z.object({
  email: z.string().email('Formato de email invalido.'),
  password: z.string().min(6, 'La contrasena debe tener al menos 6 caracteres.'),
});

const updateMeSchema = z.object({
  username: z.string().min(3).max(30).optional(),
  name: z.string().min(1).max(120).optional(),
});

interface AuthRequest extends Request {
  userId?: string;
}

const buildBaseUsername = (email: string, name?: string, preferred?: string) => {
  return (preferred || name || email.split('@')[0] || 'user')
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '.')
    .replace(/\.{2,}/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .slice(0, 24) || 'user';
};

const getUniqueUsername = async (base: string) => {
  let candidate = base;
  let suffix = 1;

  while (await prisma.user.findUnique({ where: { username: candidate } })) {
    candidate = `${base}${suffix}`;
    suffix += 1;
  }

  return candidate;
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, username } = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'El usuario con este email ya existe.' });
    }

    const baseUsername = buildBaseUsername(email, name, username);
    const finalUsername = await getUniqueUsername(baseUsername);
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        username: finalUsername,
        password: hashedPassword,
        name,
      },
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.status(201).json({
      message: 'Usuario registrado con exito',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        avatarUrl: user.avatarUrl,
        onboardingCompleted: user.onboardingCompleted,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Error de validacion', errors: error.errors });
    }
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Credenciales invalidas.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Credenciales invalidas.' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.status(200).json({
      message: 'Inicio de sesion exitoso',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        avatarUrl: user.avatarUrl,
        onboardingCompleted: user.onboardingCompleted,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Error de validacion', errors: error.errors });
    }
    console.error('Error al iniciar sesion:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const updateMe = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Usuario no autenticado.' });

    const data = updateMeSchema.parse(req.body);
    const updates: { username?: string; name?: string } = {};

    if (data.name) {
      updates.name = data.name.trim();
    }

    if (data.username) {
      const base = data.username
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, '.')
        .replace(/\.{2,}/g, '.')
        .replace(/^\.+|\.+$/g, '')
        .slice(0, 24) || 'user';

      const current = await prisma.user.findUnique({ where: { id: userId } });
      if (!current) return res.status(404).json({ message: 'Usuario no encontrado.' });

      if (current.username !== base) {
        const existing = await prisma.user.findUnique({ where: { username: base } });
        if (existing && existing.id !== userId) {
          return res.status(409).json({ message: 'Username ya en uso.' });
        }
      }
      updates.username = base;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updates,
      select: { id: true, email: true, username: true, name: true, avatarUrl: true, onboardingCompleted: true, createdAt: true },
    });

    res.status(200).json({ user });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Error de validacion', errors: error.errors });
    }
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};
