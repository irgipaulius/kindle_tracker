import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from './router';
import { RouterProvider } from 'react-router-dom';
import './styles.css';
import './i18n';
import { ToastProvider, useToast } from './components/Toast';

const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      onError: (error: any) => {
        const message = error?.message || error?.error || 'An error occurred';
        // Toast will be shown via global error boundary
        console.error('Mutation error:', message);
      },
    },
  },
});

function App() {
  const { showError } = useToast();

  React.useEffect(() => {
    // Set global error handler
    queryClient.setDefaultOptions({
      mutations: {
        onError: (error: any) => {
          const message = error?.message || error?.error || 'An error occurred';
          showError(message);
        },
      },
    });
  }, [showError]);

  return <RouterProvider router={router} />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <App />
      </ToastProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
