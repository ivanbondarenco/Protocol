import { Router } from 'express';
import { authenticateToken } from '../auth/auth.middleware';
import { searchRecipes } from './recipes.controller';

const router = Router();

router.use(authenticateToken);
router.get('/', searchRecipes);

export default router;
