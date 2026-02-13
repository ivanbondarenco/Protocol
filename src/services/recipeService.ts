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

const APP_ID = import.meta.env.VITE_EDAMAM_APP_ID || '';
const APP_KEY = import.meta.env.VITE_EDAMAM_APP_KEY || '';

export const checkApiConfig = (): boolean => {
    return !!(APP_ID && APP_KEY && APP_ID !== 'your_id_here');
};

export const searchRecipes = async (query: string): Promise<{ recipes: Recipe[], nextHref: string | null }> => {
    if (!query) return { recipes: [], nextHref: null };

    // Placeholder for when keys are missing or rejected
    if (!APP_ID || !APP_KEY) {
        console.warn("Edamam API Keys missing. Using MOCK data.");
        return searchMockRecipes(query);
    }

    console.log("Searching Edamam for:", query);
    const endpoint = `https://api.edamam.com/api/recipes/v2?type=public&q=${encodeURIComponent(query)}&app_id=${APP_ID}&app_key=${APP_KEY}&health=high-protein&calories=200-800`;

    // If 'from' is greater than 0, we would usually use the _links.next.href from the previous response.
    // However, for simplicity in this function signature, if we want to support basic pagination via params, Edamam v2 uses _cont (continuation token) in the link essentially.
    // For this implementation, we will trust the caller to pass the 'nextHref' if it's a pagination call, 
    // BUT since the user asked for infinite scroll, we explicitly need the 'next' link.
    // Let's adjust: if 'query' looks like a URL, use it directly (it's the nextHref).

    const url = query.startsWith('http') ? query : endpoint;

    try {
        const res = await fetch(url);
        if (!res.ok) {
            console.error('API Error:', res.status, res.statusText);
            const text = await res.text();
            console.error('API Response:', text);
            throw new Error(`API Request Failed: ${res.status}`);
        }
        const data = await res.json();

        // Check if hits exist
        if (!data.hits) return { recipes: [], nextHref: null };

        const recipes: Recipe[] = data.hits.map((hit: any) => {
            const r = hit.recipe;
            return {
                id: r.uri.split('#recipe_')[1], // Extract ID from URI
                label: r.label,
                image: r.image,
                calories: Math.round(r.calories / (r.yield || 1)), // Per serving approximation
                protein: Math.round((r.totalNutrients.PROCNT?.quantity || 0) / (r.yield || 1)),
                prepTime: r.totalTime || 15, // Fallback
                ingredients: r.ingredientLines,
                url: r.url
            };
        });

        return {
            recipes,
            nextHref: data._links?.next?.href || null
        };
    } catch (error) {
        console.error("Recipe Fetch Error:", error);
        console.warn("Falling back to MOCK data due to API Error.");
        return searchMockRecipes(query);
    }
};

const searchMockRecipes = (query: string): { recipes: Recipe[], nextHref: string | null } => {
    const lowerQuery = query.toLowerCase();
    const matches = FUEL_SOURCES.filter(r =>
        r.name.toLowerCase().includes(lowerQuery) ||
        r.ingredients.some(i => i.item.toLowerCase().includes(lowerQuery))
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
