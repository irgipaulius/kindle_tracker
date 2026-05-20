import React from 'react';
import { useTranslation } from 'react-i18next';

import type { LibraryCase } from './libraryLayout';
import { LibraryBookVolume } from './LibraryBookVolume';

type Props = {
  caseData: LibraryCase;
  previewId: string | null;
  touchLike: boolean;
  onPreviewOpen: (id: string) => void;
  onPreviewClose: (id: string) => void;
  onBookSelect: (id: string) => void;
};

export function LibraryBookcase({
  caseData,
  previewId,
  touchLike,
  onPreviewOpen,
  onPreviewClose,
  onBookSelect,
}: Props) {
  const { t } = useTranslation();
  const count = caseData.books.length;

  return (
    <div className="study-shelf-row">
      <div className="study-shelf-label">
        <span className="study-shelf-label-text">{caseData.label}</span>
        <span className="study-shelf-label-meta">
          {t('libraryCaseBooks', { count })}
        </span>
      </div>

      <div className="study-shelf-bay">
        <div className="study-shelf-fade study-shelf-fade--left" aria-hidden />
        <div className="study-shelf-fade study-shelf-fade--right" aria-hidden />
        <div className="study-shelf-books">
          {caseData.books.map((book) => (
            <div
              key={book.id}
              className="study-book-slot"
            >
              <LibraryBookVolume
                book={book}
                touchLike={touchLike}
                isPreview={previewId === book.id}
                onPreviewOpen={() => onPreviewOpen(book.id)}
                onPreviewClose={() => onPreviewClose(book.id)}
                onSelect={onBookSelect}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="study-shelf-board" aria-hidden />
    </div>
  );
}
