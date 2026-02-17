import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const RECIPES = [
    {
        name: 'Pechuga de Pollo y Brócoli',
        protein: 50, carbs: 10, fats: 5, calories: 300,
        ingredients: '200g pechuga de pollo, 150g brócoli, 1 cdita aceite de oliva, 1 diente ajo'
    },
    {
        name: 'Proteína Whey con Avena',
        protein: 30, carbs: 40, fats: 6, calories: 350,
        ingredients: '60g avena, 1 scoop proteína whey, 300ml agua, pizca canela'
    },
    {
        name: 'Tortilla de Claras',
        protein: 25, carbs: 2, fats: 5, calories: 160,
        ingredients: '200ml claras de huevo, 1 taza espinaca, pizca sal'
    },
    {
        name: 'Salmón y Batata',
        protein: 35, carbs: 40, fats: 20, calories: 480,
        ingredients: '150g salmón, 200g batata, 10 unidades espárragos'
    },
    {
        name: 'Salteado de Carne',
        protein: 40, carbs: 50, fats: 15, calories: 500,
        ingredients: '150g carne magra, 150g arroz (cocido), 1 taza pimientos, 1 cda salsa de soja'
    },
    {
        name: 'Bowl de Yogur Griego',
        protein: 20, carbs: 30, fats: 10, calories: 300,
        ingredients: '200g yogur griego, 1 taza frutos rojos, 1 cda miel, 10g nueces'
    },
    {
        name: 'Ensalada de Palta y Panceta',
        protein: 15, carbs: 5, fats: 35, calories: 400,
        ingredients: '1 entera palta, 2 fetas panceta, 2 tazas lechuga, 1 cda aceite de oliva'
    },
    {
        name: 'Ojo de Bife con Manteca',
        protein: 50, carbs: 0, fats: 40, calories: 560,
        ingredients: '250g ojo de bife, 1 cda manteca, rama romero'
    },
    {
        name: 'Ensalada de Atún',
        protein: 25, carbs: 5, fats: 10, calories: 210,
        ingredients: '1 lata atún en lata, 1 cda mayonesa, 1 tallo apio'
    },
    {
        name: 'Galletas de Arroz y Manteca de Maní',
        protein: 8, carbs: 25, fats: 16, calories: 280,
        ingredients: '4 galletas de arroz, 2 cdas manteca de maní'
    },
    {
        name: 'Bowl de Queso Cottage',
        protein: 25, carbs: 10, fats: 5, calories: 180,
        ingredients: '200g queso cottage, 50g piña'
    },
    {
        name: 'Batido de Proteína (Agua)',
        protein: 25, carbs: 3, fats: 2, calories: 130,
        ingredients: '1 scoop proteína whey, 300ml agua'
    },
    {
        name: 'Wrap de Pavo',
        protein: 30, carbs: 35, fats: 10, calories: 350,
        ingredients: '1 masa de wrap, 150g fiambre de pavo, hoja lechuga, 1 cdita mostaza'
    },
    {
        name: 'Huevos Duros (3)',
        protein: 18, carbs: 2, fats: 15, calories: 210,
        ingredients: '3 grandes huevos, pizca sal'
    },
    {
        name: 'Manzana y Almendras',
        protein: 4, carbs: 20, fats: 12, calories: 200,
        ingredients: '1 mediana manzana, 15g almendras'
    },
    {
        name: 'Hamburguesa Magra (Sin Pan)',
        protein: 35, carbs: 0, fats: 20, calories: 320,
        ingredients: '150g carne picada, 2 hojas de lechuga, 2 rodajas pepinillos'
    },
    {
        name: 'Avena Overnight',
        protein: 15, carbs: 50, fats: 8, calories: 330,
        ingredients: '60g avena, 150ml leche, 1 cdita semillas de chía'
    },
    {
        name: 'Panqueques de Proteína',
        protein: 30, carbs: 25, fats: 5, calories: 280,
        ingredients: '1 porción mezcla para panqueques (proteína), 2 cdas sirope sin azúcar'
    },
    {
        name: 'Salteado de Camarones',
        protein: 25, carbs: 10, fats: 5, calories: 190,
        ingredients: '150g camarones, 2 tazas vegetales mixtos, 1 cda salsa de soja'
    },
    {
        name: 'Leche Chocolatada (Post-Entreno)',
        protein: 10, carbs: 30, fats: 5, calories: 200,
        ingredients: '250ml leche, 2 cdas sirope de chocolate'
    }
];

async function main() {
    console.log('Start seeding recipes...');

    // Clear existing to avoid duplicates if re-run (optional, safe for dev)
    await prisma.recipe.deleteMany({});

    for (const r of RECIPES) {
        await prisma.recipe.create({
            data: {
                name: r.name,
                calories: r.calories,
                protein: r.protein,
                carbs: r.carbs,
                fats: r.fats,
                ingredients: r.ingredients,
                description: 'Auto-seeded from FUEL_SOURCES v3'
            }
        });
    }
    console.log(`Seeded ${RECIPES.length} recipes.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
