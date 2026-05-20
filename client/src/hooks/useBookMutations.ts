import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, Book, UserMe } from '../lib/api';

export function useBookMutations() {
  const queryClient = useQueryClient();

  const updateBookMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Book> }) => api.updateBook(id, patch),
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: ['books'] });
      const previous = queryClient.getQueryData<Book[]>(['books']);

      queryClient.setQueryData<Book[]>(['books'], (cur) => {
        const list = cur || [];
        return list.map((b) => (b._id === id ? { ...b, ...patch } : b));
      });

      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(['books'], ctx.previous);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<Book[]>(['books'], (cur) => {
        const list = cur || [];
        return list.map((b) => (b._id === updated._id ? { ...b, ...updated } : b));
      });
      void queryClient.invalidateQueries({ queryKey: ['library'] });
    },
  });

  const createBookMutation = useMutation({
    mutationFn: (payload: { title: string }) => api.createBook(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['books'] });
      await queryClient.invalidateQueries({ queryKey: ['library'] });
    },
  });

  const deleteBookMutation = useMutation({
    mutationFn: (id: string) => api.deleteBook(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['books'] });
      await queryClient.invalidateQueries({ queryKey: ['library'] });
    },
  });

  const setGenresMutation = useMutation({
    mutationFn: (genres: string[]) => api.setGenres(genres),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });

  const saveSortingMutation = useMutation({
    mutationFn: (booksSorting: { id: string; desc: boolean }[]) => api.setBooksSorting(booksSorting),
    onSuccess: (data) => {
      queryClient.setQueryData<UserMe>(['me'], (cur) =>
        cur ? { ...cur, booksSorting: data.booksSorting, booksFilter: data.booksFilter ?? cur.booksFilter } : cur
      );
    },
  });

  const saveFilterMutation = useMutation({
    mutationFn: (booksFilter: string) => api.setBooksFilter(booksFilter),
    onSuccess: (data) => {
      queryClient.setQueryData<UserMe>(['me'], (cur) =>
        cur
          ? { ...cur, booksFilter: data.booksFilter, booksSorting: data.booksSorting ?? cur.booksSorting }
          : cur
      );
    },
  });

  const patchBook = (id: string, patch: Partial<Book>) => {
    updateBookMutation.mutate({ id, patch });
  };

  const createBook = async (payload: { title: string }) => {
    return createBookMutation.mutateAsync(payload);
  };

  const deleteBook = (id: string) => {
    deleteBookMutation.mutate(id);
  };

  const upsertGenre = (value: string) => {
    const v = value.trim();
    if (!v) return;
    setGenresMutation.mutate([v]);
  };

  const saveSorting = useCallback(
    (sorting: { id: string; desc: boolean }[]) => {
      saveSortingMutation.mutate(sorting);
    },
    [saveSortingMutation]
  );

  const saveFilter = useCallback(
    (filter: string) => {
      saveFilterMutation.mutate(filter);
    },
    [saveFilterMutation]
  );

  return {
    patchBook,
    createBook,
    deleteBook,
    upsertGenre,
    saveSorting,
    saveFilter,
    isUpdating: updateBookMutation.isPending,
    isCreating: createBookMutation.isPending,
    isDeleting: deleteBookMutation.isPending,
  };
}
