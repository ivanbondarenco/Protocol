import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
    userId?: string;
}

// Configure Multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Store in backend/uploads
        const uploadDir = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'avatar-' + uniqueSuffix + ext);
    }
});

// Create Multer instance
export const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'));
        }
    }
});

export const uploadAvatar = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const protocol = req.protocol;
        const host = req.get('host');
        // Construct URL assuming static file serving is set up for /uploads
        const url = `${protocol}://${host}/uploads/${req.file.filename}`;

        if (req.userId) {
            await prisma.user.update({
                where: { id: req.userId },
                data: { avatarUrl: url },
            });
        }

        res.status(200).json({
            message: 'File uploaded successfully',
            url: url
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: 'Server error during upload' });
    }
};
