import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { computeUserStreak, parseRepeatDays, startOfDay, toDateKey } from '../habits/habit.engine';
import { eventBus } from '../core/eventBus';
import { emitToUser } from '../websocket/socket';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  userId?: string;
}

const addAllySchema = z.object({ allyUserId: z.string().min(1) });
const inviteSchema = z.object({ toUserId: z.string().min(1) });
const respondInviteSchema = z.object({ invitationId: z.string().min(1), action: z.enum(['ACCEPT', 'REJECT']) });
const challengeSchema = z.object({
  title: z.string().min(3),
  targetDays: z.number().int().min(1).max(7).optional(),
});
const joinChallengeSchema = z.object({ challengeId: z.string().min(1) });
const pingSchema = z.object({ toUserId: z.string().min(1), message: z.string().min(1).max(200).optional() });
const markPingsSeenSchema = z.object({ pingIds: z.array(z.string()).optional() });
const sparkSchema = z.object({ content: z.string().min(1).max(400) });
const sparkVoteSchema = z.object({ sparkId: z.string().min(1), value: z.union([z.literal(1), z.literal(-1)]) });
const sparkCommentSchema = z.object({ sparkId: z.string().min(1), content: z.string().min(1).max(300) });

const sanitizeText = (value: string, max = 120) =>
  value
    .replace(/\s+/g, ' ')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, max);

const resolveGridLevel = (done: number, total: number) => {
  if (total <= 0 || done <= 0) return 0;
  const pct = done / total;
  if (pct >= 1) return 4;
  if (pct >= 0.75) return 3;
  if (pct >= 0.5) return 2;
  return 1;
};

const normalizeDateStart = (date: Date) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

const buildDateWindowFromStart = (startDate: Date, days: number) => {
  const start = normalizeDateStart(startDate);
  const values: Date[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    values.push(d);
  }
  return values;
};

export const searchUsers = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Usuario no autenticado.' });

    const q = String(req.query.q || '').trim();
    if (q.length < 2) return res.status(200).json({ users: [] });
    const normalized = q.toLowerCase();

    const users = await prisma.user.findMany({
      where: { id: { not: userId } },
      select: { id: true, email: true, name: true, username: true, avatarUrl: true },
      take: 200,
      orderBy: { username: 'asc' },
    });

    const filtered = users
      .filter((u) =>
        u.username.toLowerCase().includes(normalized)
        || u.email.toLowerCase().includes(normalized)
        || (u.name || '').toLowerCase().includes(normalized)
      )
      .slice(0, 20);

    const mapped = await Promise.all(filtered.map(async (user) => ({
      id: user.id,
      email: user.email,
      name: user.name || undefined,
      username: user.username,
      avatarUrl: user.avatarUrl || undefined,
      streak: await computeUserStreak(prisma, user.id, 90),
    })));

    res.status(200).json({ users: mapped });
  } catch (error) {
    console.error('Error al buscar usuarios:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const addAlly = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Usuario no autenticado.' });
    const { allyUserId } = addAllySchema.parse(req.body);
    if (allyUserId === userId) return res.status(400).json({ message: 'No puedes agregarte como aliado.' });

    await prisma.allyship.upsert({
      where: { userId_allyUserId: { userId, allyUserId } },
      update: {},
      create: { userId, allyUserId },
    });
    await prisma.allyship.upsert({
      where: { userId_allyUserId: { userId: allyUserId, allyUserId: userId } },
      update: {},
      create: { userId: allyUserId, allyUserId: userId },
    });

    res.status(201).json({ ok: true });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: 'Error de validacion', errors: error.errors });
    console.error('Error al agregar aliado:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const getAllies = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Usuario no autenticado.' });

    const allyships = await prisma.allyship.findMany({
      where: { userId },
      include: { allyUser: { select: { id: true, email: true, name: true, username: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const allies = await Promise.all(allyships.map(async (row) => ({
      id: row.allyUser.id,
      email: row.allyUser.email,
      name: row.allyUser.name || undefined,
      username: row.allyUser.username,
      avatarUrl: row.allyUser.avatarUrl || undefined,
      streak: await computeUserStreak(prisma, row.allyUser.id, 90),
    })));

    res.status(200).json({ allies });
  } catch (error) {
    console.error('Error al obtener aliados:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const sendInvitation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Usuario no autenticado.' });
    const { toUserId } = inviteSchema.parse(req.body);
    if (toUserId === userId) return res.status(400).json({ message: 'No puedes invitarte a ti mismo.' });

    const pendingCount = await prisma.allyInvitation.count({
      where: { fromUserId: userId, status: 'PENDING' },
    });
    if (pendingCount >= 20) {
      return res.status(429).json({ message: 'Tienes demasiadas invitaciones pendientes.' });
    }

    const recentSent = await prisma.allyInvitation.count({
      where: {
        fromUserId: userId,
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      },
    });
    if (recentSent >= 30) {
      return res.status(429).json({ message: 'Límite horario de invitaciones alcanzado.' });
    }

    const invitation = await prisma.allyInvitation.upsert({
      where: { fromUserId_toUserId: { fromUserId: userId, toUserId } },
      update: { status: 'PENDING', respondedAt: null },
      create: { fromUserId: userId, toUserId, status: 'PENDING' },
    });

    emitToUser(toUserId, 'social:invite_received', {
      invitationId: invitation.id,
      fromUserId: userId,
    });

    res.status(201).json({ invitation });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: 'Error de validacion', errors: error.errors });
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const getInvitations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Usuario no autenticado.' });

    const received = await prisma.allyInvitation.findMany({
      where: { toUserId: userId, status: 'PENDING' },
      include: { fromUser: { select: { id: true, username: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ invitations: received });
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const respondInvitation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Usuario no autenticado.' });
    const { invitationId, action } = respondInviteSchema.parse(req.body);

    const invitation = await prisma.allyInvitation.findFirst({
      where: { id: invitationId, toUserId: userId, status: 'PENDING' },
    });
    if (!invitation) return res.status(404).json({ message: 'Invitacion no encontrada.' });

    const nextStatus = action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED';
    await prisma.allyInvitation.update({
      where: { id: invitation.id },
      data: { status: nextStatus, respondedAt: new Date() },
    });

    if (nextStatus === 'ACCEPTED') {
      await prisma.allyship.upsert({
        where: { userId_allyUserId: { userId: invitation.fromUserId, allyUserId: invitation.toUserId } },
        update: {},
        create: { userId: invitation.fromUserId, allyUserId: invitation.toUserId },
      });
      await prisma.allyship.upsert({
        where: { userId_allyUserId: { userId: invitation.toUserId, allyUserId: invitation.fromUserId } },
        update: {},
        create: { userId: invitation.toUserId, allyUserId: invitation.fromUserId },
      });

      emitToUser(invitation.fromUserId, 'social:invite_accepted', {
        invitationId: invitation.id,
        byUserId: invitation.toUserId,
      });
    }

    res.status(200).json({ ok: true, status: nextStatus });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: 'Error de validacion', errors: error.errors });
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const createChallenge = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Usuario no autenticado.' });
    const data = challengeSchema.parse(req.body);
    const sanitizedTitle = sanitizeText(data.title, 60);
    if (sanitizedTitle.length < 3) {
      return res.status(400).json({ message: 'Título de reto inválido.' });
    }
    const startDate = startOfDay();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    const challenge = await prisma.weeklyChallenge.create({
      data: {
        creatorId: userId,
        title: sanitizedTitle,
        targetDays: data.targetDays || 5,
        startDate,
        endDate,
      },
    });

    await prisma.weeklyChallengeParticipant.create({
      data: { challengeId: challenge.id, userId, progress: 0 },
    });

    const allies = await prisma.allyship.findMany({ where: { userId }, select: { allyUserId: true } });
    allies.forEach((ally) => {
      emitToUser(ally.allyUserId, 'social:challenge_created', { challengeId: challenge.id, title: challenge.title });
    });

    res.status(201).json({ challenge });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: 'Error de validacion', errors: error.errors });
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const joinChallenge = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Usuario no autenticado.' });
    const { challengeId } = joinChallengeSchema.parse(req.body);

    const challenge = await prisma.weeklyChallenge.findFirst({ where: { id: challengeId, active: true } });
    if (!challenge) return res.status(404).json({ message: 'Reto no encontrado.' });

    const participant = await prisma.weeklyChallengeParticipant.upsert({
      where: { challengeId_userId: { challengeId, userId } },
      update: {},
      create: { challengeId, userId },
    });

    emitToUser(challenge.creatorId, 'social:challenge_joined', {
      challengeId,
      userId,
    });

    res.status(201).json({ participant });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: 'Error de validacion', errors: error.errors });
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const getChallenges = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Usuario no autenticado.' });

    const challenges = await prisma.weeklyChallenge.findMany({
      where: {
        active: true,
        OR: [{ creatorId: userId }, { participants: { some: { userId } } }],
      },
      include: {
        participants: {
          include: { user: { select: { id: true, username: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const normalized = challenges.map((challenge) => {
      const participants = [...challenge.participants].sort((a, b) => b.progress - a.progress);
      return {
        ...challenge,
        participants,
        leaderboard: participants.slice(0, 3).map((p, idx) => ({
          rank: idx + 1,
          username: p.user.username,
          progress: p.progress,
        })),
      };
    });

    res.status(200).json({ challenges: normalized });
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const getAlliesTrackers = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Usuario no autenticado.' });
    const today = startOfDay();
    const TRACKER_DAYS = 70;

    const allyships = await prisma.allyship.findMany({
      where: { userId },
      include: { allyUser: { select: { id: true, username: true, name: true, email: true, avatarUrl: true, createdAt: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const trackers = await Promise.all(allyships.map(async (row) => {
      const allyId = row.allyUser.id;
      const accountStart = normalizeDateStart(row.allyUser.createdAt || new Date());
      const days = buildDateWindowFromStart(accountStart, TRACKER_DAYS);
      const logEnd = days[days.length - 1] < today ? days[days.length - 1] : today;
      const logEndWithTime = new Date(logEnd);
      logEndWithTime.setHours(23, 59, 59, 999);

      const habits = await prisma.habit.findMany({
        where: { userId: allyId, isActive: true },
        select: { id: true, repeat: true, repeatDays: true },
      });
      const logs = await prisma.habitLog.findMany({
        where: {
          userId: allyId,
          completed: true,
          date: { gte: accountStart, lte: logEndWithTime },
        },
        select: { habitId: true, date: true },
      });

      const perDay = new Map<string, Set<string>>();
      logs.forEach((log) => {
        const key = toDateKey(log.date);
        if (!perDay.has(key)) perDay.set(key, new Set<string>());
        perDay.get(key)!.add(log.habitId);
      });

      const activity = days.map((day) => {
        if (day > today) return 0;
        const key = toDateKey(day);
        const weekday = day.getDay();
        const scheduled = habits.filter((habit) =>
          habit.repeat !== 'WEEKLY' || parseRepeatDays(habit.repeatDays).includes(weekday)
        );
        const done = scheduled.filter((habit) => perDay.get(key)?.has(habit.id)).length;
        return resolveGridLevel(done, scheduled.length);
      });

      return {
        id: allyId,
        username: row.allyUser.username,
        name: row.allyUser.name || undefined,
        email: row.allyUser.email,
        avatarUrl: row.allyUser.avatarUrl || undefined,
        accountStartDate: toDateKey(accountStart),
        activity,
      };
    }));

    res.status(200).json({ trackers });
  } catch (error) {
    console.error('Error al obtener trackers de aliados:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const createSpark = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Usuario no autenticado.' });
    const { content } = sparkSchema.parse(req.body);

    const start = startOfDay();
    const createdToday = await prisma.socialSpark.count({
      where: {
        userId,
        createdAt: { gte: start },
      },
    });
    if (createdToday >= 5) {
      return res.status(429).json({ message: 'Limite diario alcanzado: maximo 5 chispas compartidas por dia.' });
    }

    const spark = await prisma.socialSpark.create({
      data: {
        userId,
        content: sanitizeText(content, 400),
      },
      include: {
        user: { select: { id: true, username: true, name: true, avatarUrl: true } },
      },
    });

    const allies = await prisma.allyship.findMany({ where: { userId }, select: { allyUserId: true } });
    allies.forEach((ally) => {
      emitToUser(ally.allyUserId, 'social:spark_published', { sparkId: spark.id, fromUserId: userId });
    });

    res.status(201).json({
      spark: {
        id: spark.id,
        content: spark.content,
        createdAt: spark.createdAt,
        user: spark.user,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: 'Error de validacion', errors: error.errors });
    console.error('Error al publicar chispa:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const getSparkFeed = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Usuario no autenticado.' });

    const allies = await prisma.allyship.findMany({ where: { userId }, select: { allyUserId: true } });
    const allowedUserIds = [userId, ...allies.map((a) => a.allyUserId)];

    const sparks = await prisma.socialSpark.findMany({
      where: { userId: { in: allowedUserIds } },
      include: {
        user: { select: { id: true, username: true, name: true, avatarUrl: true } },
        votes: { select: { userId: true, value: true } },
        comments: {
          include: {
            user: { select: { id: true, username: true, name: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'asc' },
          take: 20,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 40,
    });

    const start = startOfDay();
    const myTodayCount = await prisma.socialSpark.count({
      where: { userId, createdAt: { gte: start } },
    });

    const normalized = sparks.map((spark) => {
      const upvotes = spark.votes.filter((v) => v.value === 1).length;
      const downvotes = spark.votes.filter((v) => v.value === -1).length;
      const myVote = spark.votes.find((v) => v.userId === userId)?.value || 0;
      return {
        id: spark.id,
        content: spark.content,
        createdAt: spark.createdAt,
        user: spark.user,
        upvotes,
        downvotes,
        myVote,
        comments: spark.comments,
      };
    });

    res.status(200).json({ sparks: normalized, myTodayCount });
  } catch (error) {
    console.error('Error al obtener feed de chispas:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const voteSpark = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Usuario no autenticado.' });
    const { sparkId, value } = sparkVoteSchema.parse(req.body);

    const spark = await prisma.socialSpark.findUnique({ where: { id: sparkId } });
    if (!spark) return res.status(404).json({ message: 'Chispa no encontrada.' });

    await prisma.socialSparkVote.upsert({
      where: { sparkId_userId: { sparkId, userId } },
      update: { value },
      create: { sparkId, userId, value },
    });

    res.status(200).json({ ok: true });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: 'Error de validacion', errors: error.errors });
    console.error('Error al votar chispa:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const commentSpark = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Usuario no autenticado.' });
    const { sparkId, content } = sparkCommentSchema.parse(req.body);

    const spark = await prisma.socialSpark.findUnique({ where: { id: sparkId } });
    if (!spark) return res.status(404).json({ message: 'Chispa no encontrada.' });

    const comment = await prisma.socialSparkComment.create({
      data: {
        sparkId,
        userId,
        content: sanitizeText(content, 300),
      },
      include: {
        user: { select: { id: true, username: true, name: true, avatarUrl: true } },
      },
    });

    if (spark.userId !== userId) {
      emitToUser(spark.userId, 'social:spark_commented', { sparkId, byUserId: userId, commentId: comment.id });
    }

    res.status(201).json({ comment });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: 'Error de validacion', errors: error.errors });
    console.error('Error al comentar chispa:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const sendPing = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Usuario no autenticado.' });
    const { toUserId, message } = pingSchema.parse(req.body);
    if (toUserId === userId) return res.status(400).json({ message: 'No puedes pingearte a ti mismo.' });

    const recentPings = await prisma.socialPing.count({
      where: {
        fromUserId: userId,
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      },
    });
    if (recentPings >= 40) {
      return res.status(429).json({ message: 'Límite horario de pings alcanzado.' });
    }

    const ping = await prisma.socialPing.create({
      data: {
        fromUserId: userId,
        toUserId,
        message: sanitizeText(message || 'No aflojes, completa tus habitos hoy.', 200),
      },
    });

    eventBus.emitEvent('social:ping_sent', { fromUserId: userId, toUserId, pingId: ping.id });
    emitToUser(toUserId, 'social:ping_received', {
      pingId: ping.id,
      fromUserId: userId,
      message: ping.message,
    });
    res.status(201).json({ ping });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: 'Error de validacion', errors: error.errors });
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const getMyPings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Usuario no autenticado.' });
    const pings = await prisma.socialPing.findMany({
      where: { toUserId: userId },
      include: { fromUser: { select: { id: true, username: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    res.status(200).json({ pings });
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const markPingsSeen = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Usuario no autenticado.' });
    const { pingIds } = markPingsSeenSchema.parse(req.body ?? {});

    if (pingIds && pingIds.length > 0) {
      await prisma.socialPing.updateMany({
        where: { toUserId: userId, id: { in: pingIds } },
        data: { seen: true },
      });
    } else {
      await prisma.socialPing.updateMany({
        where: { toUserId: userId, seen: false },
        data: { seen: true },
      });
    }
    res.status(200).json({ ok: true });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: 'Error de validacion', errors: error.errors });
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};
