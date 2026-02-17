import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ProtocolState } from '../types';
import { getProtocolDate } from '../lib/dateUtils';

import { api } from '../lib/api';

const DEFAULT_HABITS = [
    { id: '1', title: 'Deep Work (4h)', category: 'MENTAL' },
    { id: '2', title: 'Workout Protocol', category: 'PHYSICAL' },
    { id: '3', title: 'Clean Diet', category: 'PHYSICAL' },
    { id: '4', title: 'Reading (30m)', category: 'MENTAL' },
    { id: '5', title: 'No Distractions', category: 'SPIRITUAL' },
];

export const useProtocolStore = create<ProtocolState>()(
    persist(
        (set, get) => ({
            habits: DEFAULT_HABITS,
            history: {},
            trainingLogs: [],
            gymStats: { weight: 0, height: 0, monthlyCost: 0, lastPaymentDate: '2024-01-01' },
            books: [],
            insights: [],
            lastLoginDate: '',
            theme: 'CYBERPUNK',
            language: 'EN', // Default
            currentDay: getProtocolDate(),

            // Sync
            syncHabits: async () => {
                try {
                    const { habits, history: serverHistory } = await api.get('/habits');

                    set((state) => {
                        // Merge server history with local history (preserving other fields like water, macros)
                        const mergedHistory = { ...state.history };

                        Object.keys(serverHistory).forEach(date => {
                            if (!mergedHistory[date]) {
                                mergedHistory[date] = {
                                    date,
                                    completedHabits: [],
                                    screenTimeFailed: false,
                                    noGoonFailed: false,
                                    waterIntake: 0,
                                    caloriesBurned: 0,
                                    ideas: [],
                                    macros: { protein: 0, carbs: 0, fats: 0, calories: 0 }
                                };
                            }
                            // Update completions from server
                            mergedHistory[date].completedHabits = serverHistory[date].completedHabits;
                        });

                        return {
                            habits, // Replace habits with server source of truth
                            history: mergedHistory
                        };
                    });
                } catch (e) {
                    console.error("Sync Failed", e);
                }
            },

            addHabit: async (habit) => {
                // Optimistic? No, wait for ID from server to ensure data integrity
                try {
                    const newHabit = await api.post('/habits', {
                        title: habit.title,
                        category: habit.category
                    });
                    set((state) => ({ habits: [...state.habits, newHabit] }));
                } catch (e) {
                    console.error("Add Habit Failed", e);
                }
            },

            setTheme: (theme) => set(() => ({ theme })),
            setLanguage: (language) => set(() => ({ language })),

            removeHabit: async (id) => {
                // Optimistic
                const prev = get().habits;
                set((state) => ({ habits: state.habits.filter(h => h.id !== id) }));
                try {
                    await api.delete(`/habits/${id}`);
                } catch (e) {
                    set({ habits: prev }); // Rollback
                    console.error("Remove Failed", e);
                }
            },

            toggleHabit: async (habitId) => {
                const today = getProtocolDate();

                // Optimistic Update
                set((state) => {
                    const currentLog = state.history[today] || {
                        date: today,
                        completedHabits: [],
                        screenTimeFailed: false,
                        noGoonFailed: false,
                        waterIntake: 0,
                        caloriesBurned: 0,
                        ideas: [],
                        macros: { protein: 0, carbs: 0, fats: 0, calories: 0 }
                    };

                    const isCompleted = currentLog.completedHabits.includes(habitId);
                    const newCompleted = isCompleted
                        ? currentLog.completedHabits.filter(id => id !== habitId)
                        : [...currentLog.completedHabits, habitId];

                    return {
                        history: {
                            ...state.history,
                            [today]: { ...currentLog, completedHabits: newCompleted }
                        },
                        currentDay: today
                    };
                });

                // API Call
                try {
                    await api.post(`/habits/${habitId}/toggle`, { date: today });
                } catch (e) {
                    // If fails, we should technically rollback, but syncing next time will fix it.
                    console.error("Toggle Failed", e);
                }
            },

            failMonkMode: (type) => {
                const today = getProtocolDate();
                set((state) => {
                    const currentLog = state.history[today] || {
                        date: today,
                        completedHabits: [],
                        screenTimeFailed: false,
                        noGoonFailed: false,
                        waterIntake: 0,
                        caloriesBurned: 0,
                        ideas: [],
                        macros: { protein: 0, carbs: 0, fats: 0, calories: 0 }
                    };

                    return {
                        history: {
                            ...state.history,
                            [today]: {
                                ...currentLog,
                                screenTimeFailed: type === 'SCREEN' ? true : currentLog.screenTimeFailed,
                                noGoonFailed: type === 'GOON' ? true : currentLog.noGoonFailed
                            }
                        }
                    };
                });
            },

            logWater: (amount: number) => {
                const today = getProtocolDate();
                set((state) => {
                    const currentLog = state.history[today] || {
                        date: today,
                        completedHabits: [],
                        screenTimeFailed: false,
                        noGoonFailed: false,
                        waterIntake: 0,
                        caloriesBurned: 0,
                        ideas: [],
                        macros: { protein: 0, carbs: 0, fats: 0, calories: 0 }
                    };

                    return {
                        history: {
                            ...state.history,
                            [today]: {
                                ...currentLog,
                                waterIntake: Math.max(0, (currentLog.waterIntake || 0) + amount)
                            }
                        }
                    };
                });
            },

            recoverMonkMode: () => {
                // Placeholder for recovery logic
            },

            addTrainingLog: (log) => {
                const today = getProtocolDate();
                set((state) => {
                    const currentLog = state.history[today] || {
                        date: today,
                        completedHabits: [],
                        screenTimeFailed: false,
                        noGoonFailed: false,
                        waterIntake: 0,
                        caloriesBurned: 0,
                        ideas: [],
                        macros: { protein: 0, carbs: 0, fats: 0, calories: 0 }
                    };

                    // Burn Logic
                    let estimatedBurn = 0;
                    if (log.type === 'LIFT') {
                        // Duration * Intensity * 0.6
                        const duration = parseInt(log.duration) || 0;
                        const intensity = parseInt(log.intensity) || 5;
                        estimatedBurn = duration * intensity * 0.6;
                    } else if (log.type === 'CARDIO') {
                        // Duration * (Run=10, Walk=4)
                        const duration = parseInt(log.duration) || 0;
                        const factor = log.workout.toUpperCase().includes('RUN') ? 10 : 4;
                        estimatedBurn = duration * factor;
                    }

                    const newCalories = (currentLog.caloriesBurned || 0) + Math.round(estimatedBurn);

                    return {
                        trainingLogs: [log, ...state.trainingLogs],
                        history: {
                            ...state.history,
                            [today]: { ...currentLog, caloriesBurned: newCalories }
                        }
                    };
                });
            },

            updateGymStats: (stats) => {
                set((state) => ({ gymStats: { ...state.gymStats, ...stats } }));
            },

            addBook: (book) => set((state) => ({ books: [...state.books, book] })),
            removeBook: (id) => set((state) => ({ books: state.books.filter(b => b.id !== id) })),
            updateBookProgress: (id, pages) => set((state) => ({
                books: state.books.map(b => b.id === id ? { ...b, pagesRead: pages } : b)
            })),

            addInsight: (insight) => set((state) => ({ insights: [...state.insights, insight] })),

            addIdea: (text) => {
                const today = getProtocolDate();
                set((state) => {
                    const currentLog = state.history[today] || {
                        date: today,
                        completedHabits: [],
                        screenTimeFailed: false,
                        noGoonFailed: false,
                        waterIntake: 0,
                        caloriesBurned: 0,
                        ideas: [],
                        macros: { protein: 0, carbs: 0, fats: 0, calories: 0 }
                    };

                    return {
                        history: {
                            ...state.history,
                            [today]: {
                                ...currentLog,
                                ideas: [...(currentLog.ideas || []), text]
                            }
                        }
                    };
                });
            },

            logNutrition: (macros) => {
                const today = getProtocolDate();
                set((state) => {
                    const currentLog = state.history[today] || {
                        date: today,
                        completedHabits: [],
                        screenTimeFailed: false,
                        noGoonFailed: false,
                        waterIntake: 0,
                        caloriesBurned: 0,
                        ideas: [],
                        macros: { protein: 0, carbs: 0, fats: 0, calories: 0 }
                    };

                    const currentMacros = currentLog.macros || { protein: 0, carbs: 0, fats: 0, calories: 0 };

                    return {
                        history: {
                            ...state.history,
                            [today]: {
                                ...currentLog,
                                macros: {
                                    protein: currentMacros.protein + (macros.protein || 0),
                                    carbs: currentMacros.carbs + (macros.carbs || 0),
                                    fats: currentMacros.fats + (macros.fats || 0),
                                    calories: currentMacros.calories + (macros.calories || 0)
                                }
                            }
                        }
                    };
                });
            },

            removeIdea: (date, index) => {
                set((state) => {
                    const log = state.history[date];
                    if (!log || !log.ideas) return state;

                    const newIdeas = [...log.ideas];
                    newIdeas.splice(index, 1);

                    return {
                        history: {
                            ...state.history,
                            [date]: { ...log, ideas: newIdeas }
                        }
                    };
                });
            },

            editIdea: (date, index, newText) => {
                set((state) => {
                    const log = state.history[date];
                    if (!log || !log.ideas) return state;

                    const newIdeas = [...log.ideas];
                    newIdeas[index] = newText;

                    return {
                        history: {
                            ...state.history,
                            [date]: { ...log, ideas: newIdeas }
                        }
                    };
                });
            },

            updateBook: (id, updates) => set((state) => ({
                books: state.books.map(b => b.id === id ? { ...b, ...updates } : b)
            })),
            // AI Nutritionist State
            bioData: {
                age: 25, height: 175, weight: 75, activity: 1.2, goal: 'MAINTAIN', type: 'BALANCED', avatar: ''
            },
            macroTargets: { protein: 200, carbs: 250, fats: 70, calories: 2800 },

            updateBioData: (data) => set((state) => ({ bioData: { ...state.bioData, ...data } })),

            recalculateTargets: () => set((state) => {
                const { age, height, weight, activity, goal, type } = state.bioData;

                // Mifflin-St Jeor (Male Default)
                const bmr = 10 * weight + 6.25 * height - 5 * age + 5;
                let tdee = bmr * activity;

                // Goal Adjustment
                if (goal === 'CUT') tdee -= 400;
                else if (goal === 'BULK') tdee += 400;

                // Macro Split
                let protein = 0, fats = 0, carbs = 0;
                const calories = Math.round(tdee);

                switch (type) {
                    case 'BALANCED': // 30P / 40C / 30F
                        protein = (calories * 0.30) / 4;
                        carbs = (calories * 0.40) / 4;
                        fats = (calories * 0.30) / 9;
                        break;
                    case 'LOW_CARB': // 40P / 20C / 40F
                        protein = (calories * 0.40) / 4;
                        carbs = (calories * 0.20) / 4;
                        fats = (calories * 0.40) / 9;
                        break;
                    case 'KETO': // 25P / 5C / 70F
                        protein = (calories * 0.25) / 4;
                        carbs = (calories * 0.05) / 4;
                        fats = (calories * 0.70) / 9;
                        break;
                    case 'HIGH_PROTEIN': // 45P / 35C / 20F
                        protein = (calories * 0.45) / 4;
                        carbs = (calories * 0.35) / 4;
                        fats = (calories * 0.20) / 9;
                        break;
                }

                return {
                    macroTargets: {
                        protein: Math.round(protein),
                        carbs: Math.round(carbs),
                        fats: Math.round(fats),
                        calories
                    }
                };
            }),
            checkDailyReset: () => {
                const today = getProtocolDate();
                const last = get().lastLoginDate;

                if (last !== today) {
                    set({ lastLoginDate: today });
                    // Since we use date-keyed history, the new day automatically starts fresh.
                    // But if we had persistent "current session" state, we'd clear it here.
                    // For now, just updating the date ensures we are on the new key.
                }
            },

            removeTrainingLog: (index: number) => {
                set((state) => {
                    const logToRemove = state.trainingLogs[index];
                    if (!logToRemove) return state;

                    const newLogs = [...state.trainingLogs];
                    newLogs.splice(index, 1);

                    // Also remove from daily stats if it was today (approximate rollback)
                    // This is tricky if headers don't match exactly, but let's try to deduct calories
                    const today = getProtocolDate();
                    const currentLog = state.history[today];

                    if (currentLog) {
                        let burnDeduction = 0;
                        if (logToRemove.type === 'LIFT') {
                            burnDeduction = (parseInt(logToRemove.duration) || 0) * (parseInt(logToRemove.intensity) || 5) * 0.6;
                        } else {
                            const factor = logToRemove.workout.toUpperCase().includes('RUN') ? 10 : 4;
                            burnDeduction = (parseInt(logToRemove.duration) || 0) * factor;
                        }

                        const newCalories = Math.max(0, (currentLog.caloriesBurned || 0) - Math.round(burnDeduction));

                        return {
                            trainingLogs: newLogs,
                            history: {
                                ...state.history,
                                [today]: { ...currentLog, caloriesBurned: newCalories }
                            }
                        };
                    }

                    return { trainingLogs: newLogs };
                });
            },

        }),
        {
            name: 'protocol-storage-v5',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
