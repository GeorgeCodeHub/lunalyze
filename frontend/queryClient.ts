import { QueryClient } from '@tanstack/react-query';

// Everything we fetch is a static file in backend/public/data, so it never goes stale.
export const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
