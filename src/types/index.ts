export interface Habit {
    id: string;
    title: string;
    category: string; // 'PHYSICAL' | 'MENTAL' | 'SPIRITUAL' | etc
    repeat: 'DAILY' | 'WEEKLY';
    repeatDays?: number[]; // 0-6 (Sunday-Saturday) when repeat = WEEKLY
}

export interface TrainingLog {
    id: string;
    date: string;
    workout: string;
    duration: string;
    intensity: string;
    volume: number;
    type: 'LIFT' | 'CARDIO';
    distance?: number;
    calories?: number;
    // Detail for history lookup
    exercises?: { name: string, weight: number, sets: number, reps: number }[];
}

export interface GymStats {
    weight: number;
    height: number;
    monthlyCost: number;
    lastPaymentDate: string; // YYYY-MM-DD
}

export interface Insight {
    id: string;
    bookId: string;
    text: string;
    date: string;
}

export interface Book {
    id: string;
    title: string;
    authors: string[];
    pageCount: number;
    pagesRead: number;
    coverUrl: string;
    category?: string;
}

export interface DailyLog {
    date: string;
    completedHabits: string[];
    screenTimeFailed: boolean;
    noGoonFailed: boolean;
    waterIntake: number; // ml
    caloriesBurned: number; // kcal
    ideas: string[];
    macros: {
        protein: number;
        carbs: number;
        fats: number;
        calories: number;
    };
}

export interface ProtocolState {
    // Config
    habits: Habit[];

    // Data
    history: Record<string, DailyLog>;
    trainingLogs: TrainingLog[];
    gymStats: GymStats;
    books: Book[];
    insights: Insight[];
    lastLoginDate: string;
    theme: 'MINIMAL_DARK' | 'MINIMAL_HOLISTIC' | 'MINIMAL_LIGHT';

    // Computed / Refs
    currentDay: string;

    // Actions
    checkDailyReset: () => void;
    removeTrainingLog: (index: number) => void;
    syncHabits: () => Promise<void>;
    addHabit: (habit: Habit) => Promise<void>;
    removeHabit: (id: string) => Promise<void>;
    toggleHabit: (habitId: string) => Promise<void>;
    getCurrentStreak: () => number;
    getDailyCompletion: (date: string) => { done: number; total: number; isComplete: boolean };

    failMonkMode: (type: 'SCREEN' | 'GOON') => void;
    recoverMonkMode: () => void;


    addTrainingLog: (log: TrainingLog) => void;
    updateGymStats: (stats: Partial<GymStats>) => void;
    logWater: (amount: number) => void;

    addBook: (book: Book) => void;
    removeBook: (id: string) => void;
    updateBookProgress: (id: string, page: number) => void;
    addInsight: (insight: Insight) => void;
    addIdea: (text: string) => void;
    removeIdea: (date: string, index: number) => void;
    editIdea: (date: string, index: number, newText: string) => void;
    updateBook: (id: string, updates: Partial<Book>) => void;
    // AI Nutritionist
    bioData: {
        age: number;
        height: number; // cm
        weight: number; // kg
        activity: number; // 1.2 to 1.9
        sex: 'MALE' | 'FEMALE';
        climate: 'COLD' | 'TEMPERATE' | 'HOT';
        trainingMinutes: number;
        goal: 'CUT' | 'MAINTAIN' | 'BULK';
        type: 'BALANCED' | 'LOW_CARB' | 'KETO' | 'HIGH_PROTEIN';
        username?: string;
        objectives?: string[];
        avatar?: string;
    };
    macroTargets: {
        protein: number;
        carbs: number;
        fats: number;
        calories: number;
    };
    hydrationTargetMl: number;
    logNutrition: (macros: Partial<{ protein: number; carbs: number; fats: number; calories: number }>) => void;
    updateBioData: (data: Partial<ProtocolState['bioData']>) => void;
    recalculateTargets: () => void;
    setTheme: (theme: 'MINIMAL_DARK' | 'MINIMAL_HOLISTIC' | 'MINIMAL_LIGHT') => void;

    // Localization
    language: 'EN' | 'ES';
    setLanguage: (lang: 'EN' | 'ES') => void;

    // Onboarding
    onboardingByUserId: Record<string, boolean>;
    completeOnboarding: (userId: string) => void;
}
