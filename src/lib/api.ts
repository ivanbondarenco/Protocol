import { useAuthStore } from '../store/useAuthStore';

const BASE_URL = 'http://localhost:4000/api';

const forceLogoutOnAuthFailure = (status: number, rawText: string) => {
    if (status !== 401 && status !== 403) return;

    const lower = rawText.toLowerCase();
    const looksLikeTokenIssue =
        lower.includes('token') ||
        lower.includes('expired') ||
        lower.includes('expirado') ||
        lower.includes('unauthorized') ||
        lower.includes('forbidden');

    if (!looksLikeTokenIssue) return;

    useAuthStore.getState().logout();
    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        window.location.href = '/';
    }
};

const parseJsonSafe = (text: string) => {
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
};

const request = async (endpoint: string, init: RequestInit = {}) => {
    const token = useAuthStore.getState().token;
    const headers: HeadersInit = {
        ...(init.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const res = await fetch(`${BASE_URL}${endpoint}`, { ...init, headers });
    const raw = await res.text();
    const data = parseJsonSafe(raw);

    if (!res.ok) {
        forceLogoutOnAuthFailure(res.status, raw);
        throw new Error((data && data.message) || raw || `Request failed (${res.status})`);
    }

    return data;
};

export const api = {
    get(endpoint: string) {
        return request(endpoint);
    },

    post(endpoint: string, body: any) {
        return request(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
    },

    put(endpoint: string, body: any) {
        return request(endpoint, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
    },

    delete(endpoint: string) {
        return request(endpoint, { method: 'DELETE' });
    },

    async upload(endpoint: string, file: File) {
        const token = useAuthStore.getState().token;
        const formData = new FormData();
        formData.append('avatar', file);

        const res = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData
        });

        const raw = await res.text();
        const data = parseJsonSafe(raw);

        if (!res.ok) {
            forceLogoutOnAuthFailure(res.status, raw);
            throw new Error((data && data.message) || raw || `Upload failed (${res.status})`);
        }

        return data;
    }
};
