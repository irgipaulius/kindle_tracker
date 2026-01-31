import mongoose from 'mongoose';

const BookSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    index: { type: Number, default: 0, index: true },

    title: { type: String, required: true },
    author: { type: String },
    coverUrl: { type: String },
    status: { type: String, enum: ['to_read', 'reading', 'read'], default: 'to_read' },
    downloaded: { type: Boolean, default: false },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    date: { type: String },
    finishedDate: { type: Date },
    genre: { type: String },
    language: { type: String },
    comment: { type: String },
  },
  { timestamps: true }
);

export const Book = mongoose.model('Book', BookSchema);
