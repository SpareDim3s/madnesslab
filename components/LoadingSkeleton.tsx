import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('animate-pulse rounded bg-gray-800', className)} />
  )
}

export function MatchupCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 space-y-3">
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-12" />
        </div>
        <Skeleton className="h-2 w-full" />
        <div className="flex justify-between">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-12" />
        </div>
      </div>
    </div>
  )
}

export function TeamCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-1">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function StatGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="rounded-lg border border-gray-800 p-3 space-y-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-6 w-12" />
        </div>
      ))}
    </div>
  )
}
