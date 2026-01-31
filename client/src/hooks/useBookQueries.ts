import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useBookQueries() {
  const booksQuery = useQuery({
    queryKey: ['books'],
    queryFn: api.listBooks,
  });

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: api.getMe,
  });

  const books = booksQuery.data || [];
  const genreOptions = meQuery.data?.genres || [];

  return {
    books,
    genreOptions,
    isLoading: booksQuery.isLoading || meQuery.isLoading,
    isError: booksQuery.isError || meQuery.isError,
    error: booksQuery.error || meQuery.error,
  };
}
