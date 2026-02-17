import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'SUPER_SECRET_PROTOCOL_KEY';
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// --- SCHEMAS ---
const RegisterSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().optional()
});

const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string()
});

// --- MIDDLEWARE ---
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        res.sendStatus(401);
        return;
    }

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) {
            res.sendStatus(403);
            return;
        }
        (req as any).user = user;
        next();
    });
};

// --- ROUTES ---

app.get('/', (_req: Request, res: Response) => {
    res.send('PROTOCOL BACKEND ONLINE 🟢');
});

// AUTH
app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
        console.log('Register Request:', req.body);
        const { email, password, name } = RegisterSchema.parse(req.body);

        const existingUser = await prisma.user.findUnique({ where: { email } });
        console.log('Existing Check:', existingUser ? 'Found' : 'New');

        if (existingUser) {
            res.status(400).json({ error: "User already exists" });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { email, password: hashedPassword, name }
        });
        console.log('User Created:', user.id);

        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });

        res.json({
            token,
            user: { id: user.id, email: user.email, name: user.name, level: user.level }
        });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            console.log('Validation Error:', error.errors);
            res.status(400).json({ error: "Validation failed", details: error.errors });
            return;
        }

        console.log('Registration Error Message:', error.message);
        res.status(400).json({ error: "Registration failed", details: error.message || "Unknown error" });
    }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = LoginSchema.parse(req.body);

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(400).json({ error: "User not found" });
            return;
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            res.status(400).json({ error: "Invalid password" });
            return;
        }

        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });

        res.json({
            token,
            user: { id: user.id, email: user.email, name: user.name, level: user.level }
        });
    } catch (error) {
        res.status(400).json({ error: "Login failed", details: error });
    }
});

// PROTECTED ROUTES EXAMPLE
app.get('/api/me', authenticateToken, async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    res.json(user);
});

// Habits (Protected)
// Habits (Protected)
const HabitSchema = z.object({
    title: z.string().min(1),
    category: z.string()
});

app.get('/api/habits', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;

        // Fetch user's habits
        const habits = await prisma.habit.findMany({
            where: { userId }
        });

        // Fetch logs (last 365 days mostly relevant, but simpler to fetch all for now)
        const logs = await prisma.habitLog.findMany({
            where: { userId }
        });

        // Transform logs into Frontend History format: { "YYYY-MM-DD": { completedHabits: ["id1", "id2"] } }
        const history: Record<string, { completedHabits: string[] }> = {};

        logs.forEach(log => {
            const dateKey = log.date.toISOString().split('T')[0]; // YYYY-MM-DD
            if (!history[dateKey]) {
                history[dateKey] = { completedHabits: [] };
            }
            history[dateKey].completedHabits.push(log.habitId);
        });

        res.json({ habits, history });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch habits" });
    }
});

app.post('/api/habits', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { title, category } = HabitSchema.parse(req.body);

        const habit = await prisma.habit.create({
            data: {
                title,
                category,
                userId
            }
        });

        res.json(habit);
    } catch (error) {
        res.status(400).json({ error: "Failed to create habit" });
    }
});

app.delete('/api/habits/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { id } = req.params;

        // Verify ownership
        const habit = await prisma.habit.findFirst({
            where: { id, userId }
        });

        if (!habit) {
            res.status(404).json({ error: "Habit not found" });
            return;
        }

        await prisma.habit.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete habit" });
    }
});

app.post('/api/habits/:id/toggle', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { id } = req.params;
        const { date } = req.body; // Expect "YYYY-MM-DD"

        if (!date) {
            res.status(400).json({ error: "Date is required" });
            return;
        }

        const dateObj = new Date(date); // Ensure this parses correctly based on server locale/UTC

        // Check if log exists
        const existingLog = await prisma.habitLog.findFirst({
            where: {
                habitId: id,
                userId,
                date: dateObj
            }
        });

        if (existingLog) {
            // Untoggle -> Delete
            await prisma.habitLog.delete({ where: { id: existingLog.id } });
            res.json({ checked: false });
        } else {
            // Toggle -> Create
            await prisma.habitLog.create({
                data: {
                    habitId: id,
                    userId,
                    date: dateObj,
                    completed: true
                }
            });
            res.json({ checked: true });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to toggle habit" });
    }
});

// Workouts (Protected)
app.get('/api/workouts', authenticateToken, async (_req, res) => {
    // Implement Log and Stats
    res.json({ message: "Workouts Endpoint (Protected)" });
});

// Nutrition (Protected)
app.get('/api/nutrition', authenticateToken, async (_req, res) => {
    // Implement Food Diary
    res.json({ message: "Nutrition Endpoint (Protected)" });
});

// --- PROXY ENDPOINTS ---

// --- LOCAL CRUD ENDPOINTS ---

// 1. EXERCISES (Catalog)
app.get('/api/exercises', async (_req: Request, res: Response) => {
    try {
        const exercises = await prisma.exercise.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(exercises);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch exercises" });
    }
});

app.post('/api/exercises', async (req: Request, res: Response) => {
    try {
        const { name, muscleGroup } = req.body;
        if (!name || !muscleGroup) {
            res.status(400).json({ error: "Name and muscleGroup are required" });
            return;
        }
        const exercise = await prisma.exercise.create({
            data: { name, muscleGroup }
        });
        res.json(exercise);
    } catch (error) {
        res.status(500).json({ error: "Failed to create exercise" });
    }
});

// 2. RECIPES
// 2. RECIPES
app.get('/api/recipes', async (req: Request, res: Response) => {
    try {
        const q = req.query.q as string | undefined;
        const where = q ? {
            OR: [
                { name: { contains: q } },
                { ingredients: { contains: q } }
            ]
        } : {};

        const recipes = await prisma.recipe.findMany({
            where: where as any // Cast to any to bypass potential type mismatch if client generation failed
        });
        res.json(recipes);
    } catch (error) {
        console.error("Recipe Fetch Error:", error);
        res.status(500).json({ error: "Failed to fetch recipes" });
    }
});

// 3. BOOKS (Vault)
app.get('/api/books', async (_req: Request, res: Response) => {
    try {
        const books = await prisma.book.findMany({
            orderBy: { title: 'asc' }
        });
        res.json(books);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch books" });
    }
});

app.post('/api/books', async (req: Request, res: Response) => {
    try {
        const { title, author, pages, coverUrl } = req.body;
        if (!title || !author || !pages) {
            res.status(400).json({ error: "Title, author, and pages are required" });
            return;
        }
        const book = await prisma.book.create({
            data: {
                title,
                author,
                pages: parseInt(pages),
                coverUrl
            }
        });
        res.json(book);
    } catch (error) {
        res.status(500).json({ error: "Failed to create book" });
    }
});

// 4. LINK VAULT
app.get('/api/links', async (_req: Request, res: Response) => {
    try {
        const links = await prisma.linkVault.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(links);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch links" });
    }
});

app.post('/api/links', async (req: Request, res: Response) => {
    try {
        const { platform, url, notes } = req.body;
        if (!platform || !url) {
            res.status(400).json({ error: "Platform and URL are required" });
            return;
        }
        const link = await prisma.linkVault.create({
            data: { platform, url, notes }
        });
        res.json(link);
    } catch (error) {
        res.status(500).json({ error: "Failed to create link" });
    }
});


app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
