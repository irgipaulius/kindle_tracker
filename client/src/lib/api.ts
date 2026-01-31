const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5174';

export type UserMe = {
  id: string;
  email?: string;
  name: string;
  picture?: string;
  preferredLocale: 'en' | 'fr';
  genres: string[];
  booksSorting?: { id: string; desc: boolean }[];
};

export type Book = {
  _id: string;
  userId: string;
  index?: number;
  title: string;
  author?: string;
  coverUrl?: string | null;
  status: 'to_read' | 'reading' | 'read';
  downloaded: boolean;
  rating: number;
  date?: string;
  finishedDate?: string | null;
  genre?: string;
  language?: string;
  comment?: string;
};

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  baseUrl: API_BASE_URL,
  getMe: () => apiFetch<UserMe>('/api/me'),
  setLocale: (preferredLocale: 'en' | 'fr') =>
    apiFetch<{ id: string; preferredLocale: 'en' | 'fr' }>('/api/me/preferences', {
      method: 'PATCH',
      body: JSON.stringify({ preferredLocale }),
    }),
  setBooksSorting: (booksSorting: { id: string; desc: boolean }[]) =>
    apiFetch<{ id: string; booksSorting: { id: string; desc: boolean }[] }>('/api/me/preferences', {
      method: 'PATCH',
      body: JSON.stringify({ booksSorting }),
    }),
  setGenres: (genres: string[]) =>
    apiFetch<{ id: string; genres: string[] }>('/api/me/genres', {
      method: 'PATCH',
      body: JSON.stringify({ genres }),
    }),
  logout: () => apiFetch<{ ok: true }>('/auth/logout', { method: 'POST' }),

  listBooks: () => apiFetch<Book[]>('/api/books'),
  createBook: (payload: Partial<Book> & { title: string }) =>
    apiFetch<Book>('/api/books', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateBook: (id: string, patch: Partial<Book>) =>
    apiFetch<Book>(`/api/books/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
  deleteBook: (id: string) => apiFetch<{ ok: true }>(`/api/books/${id}`, { method: 'DELETE' }),
};
