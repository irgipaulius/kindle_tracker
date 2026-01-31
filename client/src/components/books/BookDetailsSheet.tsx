import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { Book } from '../../lib/api';
import { BookTitleAutocomplete } from '../BookTitleAutocomplete';
import { DatePickerPopover } from '../DatePickerPopover';
import { GenreInput } from '../GenreInput';
import { StarRating } from '../StarRating';
import { InlineText } from '../table/InlineText';
import { statusLabel } from '../../utils/bookHelpers';
import { StatusSelect } from './StatusSelect';
import { X, BookOpen, Calendar, Star, Tag, Globe, MessageSquare, Download } from 'lucide-react';

interface BookDetailsSheetProps {
  book: Book;
  onClose: () => void;
  onPatchBook: (id: string, patch: Partial<Book>) => void;
  onDelete: (id: string) => void;
  genreOptions: string[];
  onAddGenre: (value: string) => void;
  t: (key: string) => string;
}

export function BookDetailsSheet({ 
  book, 
  onClose, 
  onPatchBook, 
  onDelete, 
  genreOptions, 
  onAddGenre, 
  t 
}: BookDetailsSheetProps) {
  const [coverUrl, setCoverUrl] = useState<string | null>(book.coverUrl || null);

  React.useEffect(() => {
    setCoverUrl(book.coverUrl || null);
  }, [book.coverUrl]);

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay asChild>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm pointer-events-none"
            style={{ zIndex: 50 }}
          />
        </Dialog.Overlay>
        
        <Dialog.Content asChild>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20, transform: 'translate(-50%, -50%)' }}
            animate={{ opacity: 1, scale: 1, y: 0, transform: 'translate(-50%, -50%)' }}
            exit={{ opacity: 0, scale: 0.95, y: 20, transform: 'translate(-50%, -50%)' }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="fixed left-1/2 top-1/2 w-full max-w-2xl border border-violet-200/20 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 shadow-2xl rounded-2xl sm:rounded-3xl pointer-events-auto"
            style={{ zIndex: 50 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-violet-200/10 bg-gradient-to-r from-violet-600/10 to-purple-600/10 px-6 py-4 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 p-2">
                  <BookOpen className="h-4 w-4 text-white" />
                </div>
                <div>
                  <Dialog.Title className="text-lg font-semibold text-white">
                    {book.title || t('title')}
                  </Dialog.Title>
                  <Dialog.Description className="text-sm text-violet-200/70">
                    {t('bookDetails')}
                  </Dialog.Description>
                </div>
              </div>
              
              <Dialog.Close asChild>
                <button
                  className="rounded-xl bg-violet-500/10 p-2 text-violet-200 hover:bg-violet-500/20 transition-colors"
                  aria-label={t('close')}
                >
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>

            {/* Content */}
            <div className="max-h-[85vh] overflow-y-auto p-6">
              <div className="grid gap-6">
                {/* Cover and Basic Info */}
                <div className="flex gap-6">
                  {/* Cover */}
                  <div className="shrink-0">
                    <div className="relative h-48 w-36 overflow-hidden rounded-2xl border border-violet-200/20 bg-gradient-to-br from-violet-900/20 to-purple-900/20 shadow-lg">
                      {coverUrl ? (
                        <img
                          src={coverUrl}
                          alt={book.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <BookOpen className="h-8 w-8 text-violet-300/50" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Title and Author */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <label className="flex items-center gap-2 text-xs font-medium text-violet-200/70 uppercase tracking-wider">
                        <BookOpen className="h-3 w-3" />
                        {t('title')}
                      </label>
                      <div className="mt-2">
                        <BookTitleAutocomplete
                          value={book.title}
                          author={book.author}
                          onApply={(patch) => onPatchBook(book._id, patch)}
                          placeholder={t('title')}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-xs font-medium text-violet-200/70 uppercase tracking-wider">
                        <BookOpen className="h-3 w-3" />
                        {t('author')}
                      </label>
                      <div className="mt-2">
                        <InlineText 
                          value={book.author || ''} 
                          onCommit={(next) => onPatchBook(book._id, { author: next })} 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grid Form */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Status */}
                  <div className="flex items-center justify-center">
                    <StatusSelect
                      value={book.status}
                      onChange={(status) => onPatchBook(book._id, { status })}
                      t={t}
                      size="md"
                    />
                  </div>

                  {/* Downloaded */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-medium text-violet-200/70 uppercase tracking-wider">
                      <Download className="h-3 w-3" />
                      {t('downloaded')}
                    </label>
                    <button
                      onClick={() => onPatchBook(book._id, { downloaded: !book.downloaded })}
                      className={`w-full rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                        book.downloaded
                          ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                          : 'border-violet-200/20 bg-slate-800/50 text-violet-200 hover:bg-violet-500/10'
                      }`}
                    >
                      {book.downloaded ? t('yes') : t('no')}
                    </button>
                  </div>

                  {/* Rating */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-medium text-violet-200/70 uppercase tracking-wider">
                      <Star className="h-3 w-3" />
                      {t('rating')}
                    </label>
                    <div className="rounded-xl border border-violet-200/20 bg-slate-800/50 p-3 backdrop-blur-sm">
                      <StarRating 
                        value={book.rating || 0} 
                        onChange={(v) => onPatchBook(book._id, { rating: v })} 
                      />
                    </div>
                  </div>

                  {/* Finished Date */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-medium text-violet-200/70 uppercase tracking-wider">
                      <Calendar className="h-3 w-3" />
                      {t('finishedDate')}
                    </label>
                    <DatePickerPopover 
                      value={book.finishedDate || null} 
                      onChange={(v) => onPatchBook(book._id, { finishedDate: v })} 
                    />
                  </div>

                  {/* Genre */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-medium text-violet-200/70 uppercase tracking-wider">
                      <Tag className="h-3 w-3" />
                      {t('genre')}
                    </label>
                    <GenreInput
                      value={book.genre || ''}
                      options={genreOptions}
                      onChange={(v) => onPatchBook(book._id, { genre: v })}
                      onAddOption={(v) => onAddGenre(v)}
                    />
                  </div>

                  {/* Language */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-medium text-violet-200/70 uppercase tracking-wider">
                      <Globe className="h-3 w-3" />
                      {t('language')}
                    </label>
                    <InlineText 
                      value={book.language || ''} 
                      onCommit={(next) => onPatchBook(book._id, { language: next })} 
                    />
                  </div>
                </div>

                {/* Comment */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-medium text-violet-200/70 uppercase tracking-wider">
                    <MessageSquare className="h-3 w-3" />
                    {t('comment')}
                  </label>
                  <textarea
                    value={book.comment || ''}
                    onChange={(e) => onPatchBook(book._id, { comment: e.target.value })}
                    placeholder={t('addComment')}
                    className="w-full rounded-xl border border-violet-200/20 bg-slate-800/50 px-4 py-3 text-sm text-white placeholder-violet-200/50 backdrop-blur-sm transition-colors focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20 resize-none h-24"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 border-t border-violet-200/10 bg-gradient-to-r from-violet-600/5 to-purple-600/5 px-6 py-4 backdrop-blur-sm">
              <div className="text-sm text-violet-200/50">
                {t('bookId')}: {book._id.slice(-8)}
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onDelete(book._id)}
                  className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-300 transition-colors hover:bg-rose-500/20"
                >
                  {t('delete')}
                </button>
                
                <Dialog.Close asChild>
                  <button
                    className="rounded-xl border border-violet-400/30 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-300 transition-colors hover:bg-violet-500/20"
                  >
                    {t('close')}
                  </button>
                </Dialog.Close>
              </div>
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
