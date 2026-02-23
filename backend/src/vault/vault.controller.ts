import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getVaultData = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;

        const ideas = await prisma.privateIdea.findMany({ where: { userId } });
        const books = await prisma.book.findMany({ where: { userId } });

        // Group ideas by dateKey
        const groupedIdeas: Record<string, string[]> = {};
        ideas.forEach(idea => {
            if (!groupedIdeas[idea.dateKey]) {
                groupedIdeas[idea.dateKey] = [];
            }
            groupedIdeas[idea.dateKey].push(idea.text);
        });

        res.json({ ideas: groupedIdeas, books });
    } catch (error) {
        console.error('[getVaultData] Error:', error);
        res.status(500).json({ error: 'Failed to fetch vault data' });
    }
};

export const syncIdeas = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { dateKey, ideas } = req.body;

        if (!dateKey) {
            return res.status(400).json({ error: 'dateKey is required' });
        }

        // Clear existing for this specific date and user
        await prisma.privateIdea.deleteMany({
            where: { userId, dateKey }
        });

        // Re-insert 
        if (ideas && Array.isArray(ideas) && ideas.length > 0) {
            await prisma.privateIdea.createMany({
                data: ideas.map((text: string) => ({
                    text,
                    dateKey,
                    userId
                }))
            });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('[syncIdeas] Error:', error);
        res.status(500).json({ error: 'Failed to sync ideas' });
    }
};

export const syncBooks = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { books } = req.body;

        // Clear all existing books for the user
        await prisma.book.deleteMany({
            where: { userId }
        });

        if (books && Array.isArray(books) && books.length > 0) {
            await prisma.book.createMany({
                data: books.map((b: any) => ({
                    id: b.id, // Using frontend ID
                    title: b.title,
                    author: b.author,
                    pages: b.pages,
                    status: b.status || 'READING',
                    coverUrl: b.coverUrl || null,
                    userId
                }))
            });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('[syncBooks] Error:', error);
        res.status(500).json({ error: 'Failed to sync books' });
    }
};
