import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IconContext } from '@phosphor-icons/react';
// Styles globaux d'abord : les CSS Modules des composants peuvent ainsi les surcharger.
import './styles/tokens.css';
import './styles/global.css';
import { App } from './App';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <IconContext.Provider value={{ weight: 'duotone' }}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </IconContext.Provider>
    </QueryClientProvider>
  </StrictMode>,
);
