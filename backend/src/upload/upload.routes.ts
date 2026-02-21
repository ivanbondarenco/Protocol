import { Router } from 'express';
import multer from 'multer';
import { upload, uploadAvatar } from './upload.controller';
import { authenticateToken } from '../auth/auth.middleware';

const router = Router();

// Upload avatar route
router.post('/avatar', authenticateToken, upload.single('avatar'), uploadAvatar);

export default router;
