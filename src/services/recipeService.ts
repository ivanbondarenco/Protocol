import { FUEL_SOURCES } from '../data/recipes';

export interface Recipe {
    id: string;
    label: string;
    image: string;
    calories: number;
    protein: number;
    prepTime: number;
    ingredients: string[];
    url: string;
}


export const checkApiConfig = (): boolean => {
    return true; // Using local backend, no external keys needed
};

export const searchRecipes = async (query: string): Promise<{ recipes: Recipe[], nextHref: string | null }> => {
    if (!query) return { recipes: [], nextHref: null };

    const endpoint = `http://localhost:4000/api/recipes?q=${encodeURIComponent(query)}`;

    try {
        const token = localStorage.getItem('token');
        const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};

        const res = await fetch(endpoint, { headers });

        if (!res.ok) {
            throw new Error(`API Request Failed: ${res.status}`);
        }

        const data = await res.json();
        const rows = Array.isArray(data) ? data : (data.recipes || []);
        const recipes: Recipe[] = rows.map((r: any) => ({
            id: r.id,
            label: r.name,
            image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=2680&ixlib=rb-4.0.3', // Placeholder
            calories: r.calories,
            protein: r.protein,
            prepTime: 15, // Default as not in DB yet
            ingredients: r.ingredients ? r.ingredients.split(',') : [],
            url: '#'
        }));

        if (recipes.length === 0) {
            return searchMockRecipes(query);
        }

        return { recipes, nextHref: null };
    } catch (error) {
        console.error("Recipe Fetch Error:", error);
        return searchMockRecipes(query);
    }
};

const searchMockRecipes = (query: string): { recipes: Recipe[], nextHref: string | null } => {
    const terms = query.toLowerCase().split(',').map(t => t.trim()).filter(Boolean);
    const matches = FUEL_SOURCES.filter(r =>
        terms.some(term =>
            r.name.toLowerCase().includes(term) ||
            r.ingredients.some(i => i.item.toLowerCase().includes(term))
        )
    );

    const recipes: Recipe[] = matches.map(r => ({
        id: r.id,
        label: r.name,
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=2680&ixlib=rb-4.0.3', // Generic food image
        calories: r.calories,
        protein: r.protein,
        prepTime: r.prepTime,
        ingredients: r.ingredients.map(i => `${i.quantity} ${i.item}`),
        url: '#'
    }));

    return { recipes, nextHref: null };
};
