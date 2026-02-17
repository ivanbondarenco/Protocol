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
    // --- ALTO EN PROTEÍNA ---
    {
        id: '1',
        name: 'Pechuga de Pollo y Brócoli',
        protein: 50,
        carbs: 10,
        fats: 5,
        calories: 300,
        ingredients: [
            { item: 'pechuga de pollo', quantity: '200g', core: true },
            { item: 'brócoli', quantity: '150g', core: true },
            { item: 'aceite de oliva', quantity: '1 cdita', core: false },
            { item: 'ajo', quantity: '1 diente', core: false }
        ],
        prepTime: 20,
        type: 'HIGH_PROTEIN'
    },
    {
        id: '2',
        name: 'Proteína Whey con Avena',
        protein: 30,
        carbs: 40,
        fats: 6,
        calories: 350,
        ingredients: [
            { item: 'avena', quantity: '60g', core: true },
            { item: 'proteína whey', quantity: '1 scoop', core: true },
            { item: 'agua', quantity: '300ml', core: false },
            { item: 'canela', quantity: 'pizca', core: false }
        ],
        prepTime: 5,
        type: 'HIGH_PROTEIN'
    },
    {
        id: '3',
        name: 'Tortilla de Claras',
        protein: 25,
        carbs: 2,
        fats: 5,
        calories: 160,
        ingredients: [
            { item: 'claras de huevo', quantity: '200ml', core: true },
            { item: 'espinaca', quantity: '1 taza', core: true },
            { item: 'sal', quantity: 'pizca', core: false }
        ],
        prepTime: 10,
        type: 'HIGH_PROTEIN'
    },

    // --- BALANCEADO ---
    {
        id: '4',
        name: 'Salmón y Batata',
        protein: 35,
        carbs: 40,
        fats: 20,
        calories: 480,
        ingredients: [
            { item: 'salmón', quantity: '150g', core: true },
            { item: 'batata', quantity: '200g', core: true },
            { item: 'espárragos', quantity: '10 unidades', core: false }
        ],
        prepTime: 30,
        type: 'BALANCED'
    },
    {
        id: '5',
        name: 'Salteado de Carne',
        protein: 40,
        carbs: 50,
        fats: 15,
        calories: 500,
        ingredients: [
            { item: 'carne magra', quantity: '150g', core: true },
            { item: 'arroz', quantity: '150g (cocido)', core: true },
            { item: 'pimientos', quantity: '1 taza', core: true },
            { item: 'salsa de soja', quantity: '1 cda', core: false }
        ],
        prepTime: 25,
        type: 'BALANCED'
    },
    {
        id: '6',
        name: 'Bowl de Yogur Griego',
        protein: 20,
        carbs: 30,
        fats: 10,
        calories: 300,
        ingredients: [
            { item: 'yogur griego', quantity: '200g', core: true },
            { item: 'frutos rojos', quantity: '1 taza', core: true },
            { item: 'miel', quantity: '1 cda', core: false },
            { item: 'nueces', quantity: '10g', core: false }
        ],
        prepTime: 5,
        type: 'BALANCED'
    },

    // --- KETO / LOW CARB ---
    {
        id: '7',
        name: 'Ensalada de Palta y Panceta',
        protein: 15,
        carbs: 5,
        fats: 35,
        calories: 400,
        ingredients: [
            { item: 'palta', quantity: '1 entera', core: true },
            { item: 'panceta', quantity: '2 fetas', core: true },
            { item: 'lechuga', quantity: '2 tazas', core: false },
            { item: 'aceite de oliva', quantity: '1 cda', core: false }
        ],
        prepTime: 10,
        type: 'KETO'
    },
    {
        id: '8',
        name: 'Ojo de Bife con Manteca',
        protein: 50,
        carbs: 0,
        fats: 40,
        calories: 560,
        ingredients: [
            { item: 'ojo de bife', quantity: '250g', core: true },
            { item: 'manteca', quantity: '1 cda', core: false },
            { item: 'romero', quantity: 'rama', core: false }
        ],
        prepTime: 15,
        type: 'KETO'
    },

    // --- SNACKS / OTROS ---
    {
        id: '9',
        name: 'Ensalada de Atún',
        protein: 25,
        carbs: 5,
        fats: 10,
        calories: 210,
        ingredients: [
            { item: 'atún en lata', quantity: '1 lata', core: true },
            { item: 'mayonesa', quantity: '1 cda', core: false },
            { item: 'apio', quantity: '1 tallo', core: false }
        ],
        prepTime: 5,
        type: 'LOW_CARB'
    },
    {
        id: '10',
        name: 'Galletas de Arroz y Manteca de Maní',
        protein: 8,
        carbs: 25,
        fats: 16,
        calories: 280,
        ingredients: [
            { item: 'galletas de arroz', quantity: '4', core: true },
            { item: 'manteca de maní', quantity: '2 cdas', core: true }
        ],
        prepTime: 2,
        type: 'BALANCED'
    },
    {
        id: '11',
        name: 'Bowl de Queso Cottage',
        protein: 25,
        carbs: 10,
        fats: 5,
        calories: 180,
        ingredients: [
            { item: 'queso cottage', quantity: '200g', core: true },
            { item: 'piña', quantity: '50g', core: false }
        ],
        prepTime: 2,
        type: 'HIGH_PROTEIN'
    },
    {
        id: '12',
        name: 'Batido de Proteína (Agua)',
        protein: 25,
        carbs: 3,
        fats: 2,
        calories: 130,
        ingredients: [
            { item: 'proteína whey', quantity: '1 scoop', core: true },
            { item: 'agua', quantity: '300ml', core: true }
        ],
        prepTime: 1,
        type: 'HIGH_PROTEIN'
    },
    {
        id: '13',
        name: 'Wrap de Pavo',
        protein: 30,
        carbs: 35,
        fats: 10,
        calories: 350,
        ingredients: [
            { item: 'masa de wrap', quantity: '1', core: true },
            { item: 'fiambre de pavo', quantity: '150g', core: true },
            { item: 'lechuga', quantity: 'hoja', core: false },
            { item: 'mostaza', quantity: '1 cdita', core: false }
        ],
        prepTime: 5,
        type: 'BALANCED'
    },
    {
        id: '14',
        name: 'Huevos Duros (3)',
        protein: 18,
        carbs: 2,
        fats: 15,
        calories: 210,
        ingredients: [
            { item: 'huevos', quantity: '3 grandes', core: true },
            { item: 'sal', quantity: 'pizca', core: false }
        ],
        prepTime: 12,
        type: 'KETO'
    },
    {
        id: '15',
        name: 'Manzana y Almendras',
        protein: 4,
        carbs: 20,
        fats: 12,
        calories: 200,
        ingredients: [
            { item: 'manzana', quantity: '1 mediana', core: true },
            { item: 'almendras', quantity: '15g', core: true }
        ],
        prepTime: 2,
        type: 'BALANCED'
    },
    {
        id: '16',
        name: 'Hamburguesa Magra (Sin Pan)',
        protein: 35,
        carbs: 0,
        fats: 20,
        calories: 320,
        ingredients: [
            { item: 'carne picada', quantity: '150g', core: true },
            { item: 'hojas de lechuga', quantity: '2', core: false },
            { item: 'pepinillos', quantity: '2 rodajas', core: false }
        ],
        prepTime: 15,
        type: 'KETO'
    },
    {
        id: '17',
        name: 'Avena Overnight',
        protein: 15,
        carbs: 50,
        fats: 8,
        calories: 330,
        ingredients: [
            { item: 'avena', quantity: '60g', core: true },
            { item: 'leche', quantity: '150ml', core: true },
            { item: 'semillas de chía', quantity: '1 cdita', core: false }
        ],
        prepTime: 5,
        type: 'BALANCED'
    },
    {
        id: '18',
        name: 'Panqueques de Proteína',
        protein: 30,
        carbs: 25,
        fats: 5,
        calories: 280,
        ingredients: [
            { item: 'mezcla para panqueques (proteína)', quantity: '1 porción', core: true },
            { item: 'sirope sin azúcar', quantity: '2 cdas', core: false }
        ],
        prepTime: 15,
        type: 'HIGH_PROTEIN'
    },
    {
        id: '19',
        name: 'Salteado de Camarones',
        protein: 25,
        carbs: 10,
        fats: 5,
        calories: 190,
        ingredients: [
            { item: 'camarones', quantity: '150g', core: true },
            { item: 'vegetales mixtos', quantity: '2 tazas', core: true },
            { item: 'salsa de soja', quantity: '1 cda', core: false }
        ],
        prepTime: 10,
        type: 'LOW_CARB'
    },
    {
        id: '20',
        name: 'Leche Chocolatada (Post-Entreno)',
        protein: 10,
        carbs: 30,
        fats: 5,
        calories: 200,
        ingredients: [
            { item: 'leche', quantity: '250ml', core: true },
            { item: 'sirope de chocolate', quantity: '2 cdas', core: false }
        ],
        prepTime: 1,
        type: 'BALANCED'
    }
];
