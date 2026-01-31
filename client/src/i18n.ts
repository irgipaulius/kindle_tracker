import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      appName: 'Hyper Reader',
      loginTitle: 'Track your reading, beautifully',
      loginSubtitle: 'Sign in with Google to manage your books.',
      loginWithGoogle: 'Continue with Google',
      logout: 'Log out',
      books: 'Books',
      manageBooksSubtitle: 'All your books in one place',
      addBook: 'Add book',
      title: 'Title',
      author: 'Author',
      status: 'Status',
      downloaded: 'Downloaded',
      rating: 'Rating',
      finishedDate: 'Finished date',
      date: 'Date',
      genre: 'Genre',
      language: 'Language',
      comment: 'Comment',
      toRead: 'To read',
      reading: 'Reading',
      read: 'Read',
      yes: 'Yes',
      no: 'No',
      locale: 'Language',
      english: 'English',
      french: 'French'
    }
  },
  fr: {
    translation: {
      appName: 'Hyper Reader',
      loginTitle: 'Suivez vos lectures, avec style',
      loginSubtitle: 'Connectez-vous avec Google pour gérer vos livres.',
      loginWithGoogle: 'Continuer avec Google',
      logout: 'Se déconnecter',
      books: 'Livres',
      manageBooksSubtitle: 'Tous vos livres au même endroit',
      addBook: 'Ajouter un livre',
      title: 'Nom du livre',
      author: 'Auteur',
      status: 'Statut',
      downloaded: 'Téléchargé',
      rating: 'Note',
      finishedDate: 'Date de fin',
      date: 'Date',
      genre: 'Genre',
      language: 'Langue',
      comment: 'Commentaire',
      toRead: 'À lire',
      reading: 'En cours',
      read: 'Lu',
      yes: 'Oui',
      no: 'Non',
      locale: 'Langue',
      english: 'Anglais',
      french: 'Français'
    }
  }
} as const;

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false }
});

export default i18n;
