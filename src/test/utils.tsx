import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

/** Affiche l'URL courante, pour vérifier la synchronisation des filtres. */
export function LocationProbe() {
  const { pathname, search, hash } = useLocation();
  return <output data-testid="location">{pathname + search + hash}</output>;
}

export function renderRoute(path: string, element: ReactElement, url = path, extra: { path: string; element: ReactElement }[] = []) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path={path} element={<>{element}<LocationProbe /></>} />
          {extra.map((r) => <Route key={r.path} path={r.path} element={<>{r.element}<LocationProbe /></>} />)}
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
