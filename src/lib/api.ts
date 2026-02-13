import { useAuthStore } from '../store/useAuthStore';

const BASE_URL = 'http://localhost:4000/api';

export const api = {
    async get(endpoint: string) {
        const token = useAuthStore.getState().token;
        const res = await fetch(`${BASE_URL}${endpoint}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },

    async post(endpoint: string, body: any) {
        const token = useAuthStore.getState().token;
        const res = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },

    async delete(endpoint: string) {
        const token = useAuthStore.getState().token;
        const res = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    }
};
