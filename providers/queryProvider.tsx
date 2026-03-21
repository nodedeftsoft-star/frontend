'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import ReactQueryDevtools only in development
const ReactQueryDevtools = dynamic(
	() => import('@tanstack/react-query-devtools').then((mod) => mod.ReactQueryDevtools),
	{
		ssr: false,
	}
);

export default function QueryProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [queryClient] = useState(() => new QueryClient({
		defaultOptions: {
			queries: {
				// Default stale time: 2 minutes
				// Data is considered fresh for 2 minutes
				staleTime: 2 * 60 * 1000,

				// Default garbage collection time: 10 minutes
				// Unused data stays in cache for 10 minutes
				gcTime: 10 * 60 * 1000,

				// Retry failed requests once
				retry: 1,

				// Don't refetch on window focus by default
				// Prevents excessive API calls when switching tabs
				refetchOnWindowFocus: false,

				// Only refetch on mount if data is stale
				refetchOnMount: true,
			},
			mutations: {
				// Retry failed mutations once
				retry: 1,
			},
		},
	}));

	return (
		<QueryClientProvider client={queryClient}>
			{children}
			{process.env.NODE_ENV === 'development' && (
				<ReactQueryDevtools initialIsOpen={false} />
			)}
		</QueryClientProvider>
	);
}
