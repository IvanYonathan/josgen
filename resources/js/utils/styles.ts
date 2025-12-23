import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import { type Column } from "@tanstack/react-table"

/**
 * 
 * @param inputs all the classes to be merged
 * @returns 
 */
export function cn(...inputs: ClassValue[])
{
  return twMerge(clsx(inputs))
}

/**
 * 
 * @param param0 
 * @returns 
 */
export function getCommonPinningStyles<T>({ column, type, withBorder = false }: { column: Column<T>, type: "header" | "cell", withBorder?: boolean }): React.CSSProperties
{ 
  const isPinned = column.getIsPinned()
  const isLastLeftPinnedColumn = isPinned === "left" && column.getIsLastColumn("left")
  const isFirstRightPinnedColumn = isPinned === "right" && column.getIsFirstColumn("right")

  return {
    boxShadow: withBorder
      ? isLastLeftPinnedColumn
        ? "-4px 0 4px -4px hsl(var(--border)) inset"
        : isFirstRightPinnedColumn
          ? "4px 0 4px -4px hsl(var(--border)) inset"
          : undefined
      : undefined,
    left: isPinned === "left" ? `${column.getStart("left")}px` : undefined,
    right: isPinned === "right" ? `${column.getAfter("right")}px` : undefined,
    opacity: isPinned ? 0.97 : 1,
    position: isPinned ? "sticky" : "relative",
    background: isPinned ? type === 'cell' ? "hsl(var(--background))" : 'hsl(var(--primary))' : "",
    width: column.getSize(),
    zIndex: isPinned ? 1 : 0,
  }
}
