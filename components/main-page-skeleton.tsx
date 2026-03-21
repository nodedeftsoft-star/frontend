import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface MainPageSkeletonProps {
  rows?: number;
}

export default function MainPageSkeleton({ rows = 8 }: MainPageSkeletonProps) {
  return (
    <div className="relative">
      {/* Header with filters and actions */}
      <div className="flex items-center justify-between mb-4 sm:sticky top-[1px] z-1 bg-white">
        <div className="flex gap-2">
          <Skeleton className="h-6 w-8" />
          <Skeleton className="h-6 w-12" />
          <Skeleton className="h-6 w-14" />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center py-4 relative">
            <Skeleton className="h-8 w-[223px] rounded-md" />
          </div>
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      </div>

      {/* Data table skeleton matching exact column structure */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="rounded-t-2xl bg-[#F9F9F9]">
              {/* Select column */}
              <TableHead className="w-12 min-w-12 max-w-12 px-4">
                <Skeleton className="h-4 w-4" />
              </TableHead>
              {/* Full Name column */}
              <TableHead className="border-r border-[#E5E8EB]">
                <div className="flex justify-center gap-2 items-center">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-4" />
                </div>
              </TableHead>
              {/* Mobile column */}
              <TableHead>
                <div className="flex justify-center gap-2 items-center">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-4" />
                </div>
              </TableHead>
              {/* Status column */}
              <TableHead>
                <div className="flex justify-center gap-2 items-center">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-4" />
                </div>
              </TableHead>
              {/* Last Updated column */}
              <TableHead>
                <div className="flex justify-center gap-2 items-center">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-4" />
                </div>
              </TableHead>
              {/* Actions column */}
              <TableHead className="w-[144px] min-w-[144px] max-w-[144px] border-l border-[#E5E8EB]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {/* Select checkbox */}
                <TableCell className="w-12 min-w-12 max-w-12 flex justify-center">
                  <Skeleton className="h-4 w-4 rounded-none" />
                </TableCell>
                {/* Full Name */}
                <TableCell className="border-r border-[#E5E8EB]">
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                {/* Mobile */}
                <TableCell>
                  <Skeleton className="h-4 w-28" />
                </TableCell>
                {/* Status */}
                <TableCell>
                  <div className="flex justify-center">
                    <Skeleton className="h-6 w-16 rounded-lg" />
                  </div>
                </TableCell>
                {/* Last Updated */}
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                {/* Actions */}
                <TableCell className="w-[144px] min-w-[144px] max-w-[144px] border-l border-[#E5E8EB]">
                  <div className="flex items-center gap-2 justify-center">
                    <Skeleton className="h-6 w-6 rounded-[1px]" />
                    <Skeleton className="h-6 w-6 rounded-[1px]" />
                    <Skeleton className="h-6 w-6 rounded-[1px]" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
