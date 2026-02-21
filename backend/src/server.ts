import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './auth/auth.routes';
import habitRoutes from './habits/habits.routes';
import recipeRoutes from './recipes/recipes.routes';
import socialRoutes from './social/social.routes';
import onboardingRoutes from './onboarding/onboarding.routes';
import insightsRoutes from './insights/insights.routes';
import uploadRoutes from './upload/upload.routes';
import exercisesRoutes from './exercises/exercises.routes';
import path from 'path';
import { authenticateToken } from './auth/auth.middleware';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/exercises', exercisesRoutes);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/saludo-protegido', authenticateToken, (req, res) => {
  res.send(`Backend de Protocol en linea. Usuario ID: ${(req as any).userId}`);
});

export { app };
