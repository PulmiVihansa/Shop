import { QueryClient } from '@tanstack/react-query';

export const QUERY_STALE_TIME = 5 * 60 * 1000;
export const QUERY_GC_TIME = 30 * 60 * 1000;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: QUERY_STALE_TIME,
      gcTime: QUERY_GC_TIME,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default queryClient;
