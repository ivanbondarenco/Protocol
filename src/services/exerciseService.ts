import { api } from '../lib/api';

export interface Exercise {
    id: string;
    name: string;
    muscleGroup: string;
}

const FALLBACK_EXERCISES: Exercise[] = [
    { id: 'fallback-bench', name: 'Bench Press', muscleGroup: 'CHEST' },
    { id: 'fallback-squat', name: 'Back Squat', muscleGroup: 'LEGS' },
    { id: 'fallback-deadlift', name: 'Deadlift', muscleGroup: 'BACK' },
    { id: 'fallback-pullup', name: 'Pull Up', muscleGroup: 'BACK' },
    { id: 'fallback-overhead', name: 'Overhead Press', muscleGroup: 'SHOULDERS' },
    { id: 'fallback-row', name: 'Barbell Row', muscleGroup: 'BACK' },
    { id: 'fallback-run', name: 'Running', muscleGroup: 'CARDIO' },
];

export const getExercises = async (): Promise<Exercise[]> => {
    try {
        const response = await api.get('/exercises');
        if (Array.isArray(response)) return response;
        if (Array.isArray(response?.exercises)) return response.exercises;
        return FALLBACK_EXERCISES;
    } catch (error) {
        console.error('Error fetching exercises:', error);
        return FALLBACK_EXERCISES;
    }
};

export const createExercise = async (name: string, muscleGroup: string): Promise<Exercise | null> => {
    try {
        const response = await api.post('/exercises', { name, muscleGroup });
        if (response?.id && response?.name) return response as Exercise;
        return null;
    } catch (error) {
        console.error('Error creating exercise:', error);
        return null;
    }
};
