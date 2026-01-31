import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import { LoginPage } from './screens/LoginPage';
import { AppLayout } from './screens/AppLayout';
import { BooksScreen } from './screens/BooksScreen';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/app" replace />, 
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/app',
    element: <AppLayout />, 
    children: [
      {
        index: true,
        element: <BooksScreen />,
      },
    ],
  },
]);
