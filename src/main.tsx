import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1 },
  },
});

async function startApp() {
  try {
    const { worker } = await import('./mocks/browser');
    await worker.start({ onUnhandledRequest: 'warn' });
  } catch {
    // MSW worker not needed for Vercel deploy
  } finally {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </QueryClientProvider>
      </StrictMode>
    );
  }
}

startApp();
