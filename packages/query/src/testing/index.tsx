import { QueryClientProvider } from '@tanstack/react-query';
import { render as rntlRender, type RenderOptions } from '@testing-library/react-native';
import { useState, type ReactElement, type ReactNode } from 'react';

import { createQueryClient } from '../query-client';

/**
 * Query provider for tests. Cache garbage-collection timers are disabled, otherwise they keep the
 * Jest process alive for minutes after the tests have finished.
 */
export function QueryTestProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => createQueryClient({ gcTime: Infinity }));
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

/** Drop-in replacement for the Testing Library `render` for components that use queries. */
export function render(ui: ReactElement, options?: RenderOptions) {
  return rntlRender(ui, { wrapper: QueryTestProvider, ...options });
}
