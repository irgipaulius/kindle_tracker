import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    googleId: { type: String, required: true, unique: true, index: true },
    email: { type: String },
    name: { type: String, required: true },
    picture: { type: String },
    preferredLocale: { type: String, enum: ['en', 'fr'], default: 'en' },
    genres: { type: [String], default: [] },
    booksSorting: {
      type: [{ id: String, desc: Boolean }],
      default: [{ id: 'index', desc: false }],
    },
  },
  { timestamps: true }
);

export const User = mongoose.model('User', UserSchema);
