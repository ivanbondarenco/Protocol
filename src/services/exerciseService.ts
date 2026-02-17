const API_URL = 'http://localhost:4000/api';

export interface Exercise {
    id: string;
    name: string;
    muscleGroup: string;
}

export const getExercises = async (): Promise<Exercise[]> => {
    try {
        const response = await fetch(`${API_URL}/exercises`);
        if (!response.ok) throw new Error('Failed to fetch exercises');
        return await response.json();
    } catch (error) {
        console.error("Error fetching exercises:", error);
        return [];
    }
};

export const createExercise = async (name: string, muscleGroup: string): Promise<Exercise | null> => {
    try {
        const response = await fetch(`${API_URL}/exercises`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, muscleGroup })
        });
        if (!response.ok) throw new Error('Failed to create exercise');
        return await response.json();
    } catch (error) {
        console.error("Error creating exercise:", error);
        return null;
    }
};
