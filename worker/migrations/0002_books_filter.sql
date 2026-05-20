ALTER TABLE users ADD COLUMN books_filter_json TEXT NOT NULL DEFAULT '';

-- Legacy default pointed at a non-existent "index" column — treat as no sort.
UPDATE users SET books_sorting_json = '[]' WHERE books_sorting_json = '[{"id":"index","desc":false}]';
