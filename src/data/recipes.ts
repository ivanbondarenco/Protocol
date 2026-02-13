export interface Ingredient {
    item: string;
    quantity: string;
    core: boolean; // True if essential (e.g. Chicken), False if pantry (e.g. Salt)
}

export interface Recipe {
    id: string;
    name: string;
    protein: number;
    carbs: number;
    fats: number;
    calories: number;
    ingredients: Ingredient[];
    prepTime: number; // minutes
    type: 'BALANCED' | 'KETO' | 'HIGH_PROTEIN' | 'LOW_CARB';
}

export const FUEL_SOURCES: Recipe[] = [
    // --- HIGH PROTEIN ---
    {
        id: '1',
        name: 'Chicken Breast & Broccoli',
        protein: 50,
        carbs: 10,
        fats: 5,
        calories: 300,
        ingredients: [
            { item: 'chicken breast', quantity: '200g', core: true },
            { item: 'broccoli', quantity: '150g', core: true },
            { item: 'olive oil', quantity: '1 tsp', core: false },
            { item: 'garlic', quantity: '1 clove', core: false }
        ],
        prepTime: 20,
        type: 'HIGH_PROTEIN'
    },
    {
        id: '2',
        name: 'Whey Protein & Oats',
        protein: 30,
        carbs: 40,
        fats: 6,
        calories: 350,
        ingredients: [
            { item: 'oats', quantity: '60g', core: true },
            { item: 'whey protein', quantity: '1 scoop', core: true },
            { item: 'water', quantity: '300ml', core: false },
            { item: 'cinnamon', quantity: 'pinch', core: false }
        ],
        prepTime: 5,
        type: 'HIGH_PROTEIN'
    },
    {
        id: '3',
        name: 'Egg White Omelette',
        protein: 25,
        carbs: 2,
        fats: 5,
        calories: 160,
        ingredients: [
            { item: 'egg whites', quantity: '200ml', core: true },
            { item: 'spinach', quantity: '1 cup', core: true },
            { item: 'salt', quantity: 'pinch', core: false }
        ],
        prepTime: 10,
        type: 'HIGH_PROTEIN'
    },

    // --- BALANCED ---
    {
        id: '4',
        name: 'Salmon & Sweet Potato',
        protein: 35,
        carbs: 40,
        fats: 20,
        calories: 480,
        ingredients: [
            { item: 'salmon', quantity: '150g', core: true },
            { item: 'sweet potato', quantity: '200g', core: true },
            { item: 'asparagus', quantity: '10 spears', core: false }
        ],
        prepTime: 30,
        type: 'BALANCED'
    },
    {
        id: '5',
        name: 'Beef Stir Fry',
        protein: 40,
        carbs: 50,
        fats: 15,
        calories: 500,
        ingredients: [
            { item: 'lean beef', quantity: '150g', core: true },
            { item: 'rice', quantity: '150g (cooked)', core: true },
            { item: 'peppers', quantity: '1 cup', core: true },
            { item: 'soy sauce', quantity: '1 tbsp', core: false }
        ],
        prepTime: 25,
        type: 'BALANCED'
    },
    {
        id: '6',
        name: 'Greek Yogurt Bowl',
        protein: 20,
        carbs: 30,
        fats: 10,
        calories: 300,
        ingredients: [
            { item: 'greek yogurt', quantity: '200g', core: true },
            { item: 'berries', quantity: '1 cup', core: true },
            { item: 'honey', quantity: '1 tbsp', core: false },
            { item: 'walnuts', quantity: '10g', core: false }
        ],
        prepTime: 5,
        type: 'BALANCED'
    },

    // --- KETO / LOW CARB ---
    {
        id: '7',
        name: 'Avocado & Bacon Salad',
        protein: 15,
        carbs: 5,
        fats: 35,
        calories: 400,
        ingredients: [
            { item: 'avocado', quantity: '1 whole', core: true },
            { item: 'bacon', quantity: '2 slices', core: true },
            { item: 'lettuce', quantity: '2 cups', core: false },
            { item: 'olive oil', quantity: '1 tbsp', core: false }
        ],
        prepTime: 10,
        type: 'KETO'
    },
    {
        id: '8',
        name: 'Ribeye Steak',
        protein: 50,
        carbs: 0,
        fats: 40,
        calories: 560,
        ingredients: [
            { item: 'ribeye steak', quantity: '250g', core: true },
            { item: 'butter', quantity: '1 tbsp', core: false },
            { item: 'rosemary', quantity: 'sprig', core: false }
        ],
        prepTime: 15,
        type: 'KETO'
    },

    // --- SNACKS / OTHERS ---
    {
        id: '9',
        name: 'Tuna Salad',
        protein: 25,
        carbs: 5,
        fats: 10,
        calories: 210,
        ingredients: [
            { item: 'canned tuna', quantity: '1 can', core: true },
            { item: 'mayo', quantity: '1 tbsp', core: false },
            { item: 'celery', quantity: '1 stalk', core: false }
        ],
        prepTime: 5,
        type: 'LOW_CARB'
    },
    {
        id: '10',
        name: 'Rice Cakes & Peanut Butter',
        protein: 8,
        carbs: 25,
        fats: 16,
        calories: 280,
        ingredients: [
            { item: 'rice cakes', quantity: '4', core: true },
            { item: 'peanut butter', quantity: '2 tbsp', core: true }
        ],
        prepTime: 2,
        type: 'BALANCED'
    }
];
