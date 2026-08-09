import { cn } from "@/lib/utils"
import { RiLoaderLine } from "@remixicon/react"

const sizeMap = {
  sm: "size-3",
  md: "size-4",
  lg: "size-6",
  xl: "size-8",
}

function Spinner({
  className,
  size,
  ...props
}) {
  return (
    <RiLoaderLine
      data-slot="spinner"
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", size && sizeMap[size], className)}
      {...props} />
  );
}

export { Spinner }
