export interface GoogleBookResult {
    id: string;
    title: string;
    authors: string[];
    pageCount: number;
    coverUrl: string;
    description?: string;
}

export const searchGoogleBooks = async (query: string): Promise<GoogleBookResult[]> => {
    try {
        const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10`);
        if (!res.ok) throw new Error('API Error');

        const data = await res.json();
        if (!data.items) return [];

        return data.items.map((item: any) => {
            const info = item.volumeInfo;
            return {
                id: item.id,
                title: info.title,
                authors: info.authors || ['Unknown'],
                pageCount: info.pageCount || 100, // Default if missing
                coverUrl: info.imageLinks?.thumbnail?.replace('http:', 'https:') || '', // Secure link
                description: info.description
            };
        });
    } catch (error) {
        console.error("Google Books API Failed", error);
        throw error;
    }
};
