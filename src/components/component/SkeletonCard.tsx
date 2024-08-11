import { Skeleton } from "@/components/ui/skeleton"

export function SkeletonCard({ list } : { list: boolean}) {
  return (
    <div className="flex flex-col space-y-3 w-[500px]">
      {/* {!list && <Skeleton className="h-[250px] w-[350px] rounded-xl" />} */}
      {list ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      ) : (
        <div className="space-y-2">
          <Skeleton className="h-4 w-[150px]" />
          <Skeleton className="h-4 w-[150px]" />
        </div>
      )}
    </div>
  )
}
