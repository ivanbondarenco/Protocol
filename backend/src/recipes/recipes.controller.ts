import { Response, Request } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  userId?: string;
}

export const searchRecipes = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Usuario no autenticado.' });
    }

    const q = String(req.query.q || '').trim();
    if (!q) return res.status(200).json([]);

    const terms = q.split(',').map((t) => t.trim()).filter(Boolean);
    const where = {
      OR: terms.flatMap((term) => ([
        { name: { contains: term } },
        { ingredients: { contains: term } },
      ])),
    };

    const recipes = await prisma.recipe.findMany({
      where,
      take: 30,
      orderBy: { name: 'asc' },
    });
    if (recipes.length > 0) {
      return res.status(200).json(recipes);
    }

    // External fallback: OpenFoodFacts (free/public)
    const openFoodUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=20`;
    const response = await fetch(openFoodUrl);
    if (!response.ok) {
      return res.status(200).json([]);
    }
    const payload = await response.json() as any;
    const products = Array.isArray(payload.products) ? payload.products : [];

    const mapped = products
      .filter((p: any) => p?.product_name)
      .map((p: any) => {
        const nutriments = p.nutriments || {};
        const calories = Math.round(Number(nutriments['energy-kcal_100g'] || nutriments['energy-kcal'] || 0));
        const protein = Math.round(Number(nutriments.proteins_100g || nutriments.proteins || 0));
        const ingredientText = p.ingredients_text || '';
        return {
          id: `off-${p.code || Math.random().toString(36).slice(2)}`,
          name: p.product_name,
          calories: Number.isFinite(calories) ? calories : 0,
          protein: Number.isFinite(protein) ? protein : 0,
          ingredients: ingredientText,
        };
      })
      .slice(0, 20);

    res.status(200).json(mapped);
  } catch (error) {
    console.error('Error al buscar recetas:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};
