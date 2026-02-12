import ResultsDisplay from '@/components/geowhiz/ResultsDisplay';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

function LoadingFallback() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-4">
        <Skeleton className="h-10 w-3/4 mx-auto" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-12 w-1/3 mx-auto mt-4" />
      </div>
    </main>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResultsDisplay />
    </Suspense>
  );
}
