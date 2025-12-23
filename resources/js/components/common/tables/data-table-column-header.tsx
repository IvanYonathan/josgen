import {
  ArrowDownIcon,
  ArrowUpIcon,
  CaretSortIcon,
} from "@radix-ui/react-icons"
import { type Column } from "@tanstack/react-table"
import { cn } from "@/utils/styles"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


interface DataTableColumnHeaderProps<TData, TValue> extends React.HTMLAttributes<HTMLDivElement>
{
  column: Column<TData, TValue>
  title: string
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: Readonly<DataTableColumnHeaderProps<TData, TValue>>)
{
  if (!column.getCanSort())
  {
    return <div className={cn("h-8 flex flex-row items-center text-xs text-primary-foreground", className)}>{title}</div>
  }

  return (
    <div className={cn("flex items-center space-x-2 text-primary-foreground", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label={
              column.getIsSorted() === "desc"
                ? "Sorted descending. Click to sort ascending."
                : column.getIsSorted() === "asc"
                  ? "Sorted ascending. Click to sort descending."
                  : "Not sorted. Click to sort ascending."
            }
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 hover:bg-accent/20 hover:text-primary-foreground data-[state=open]:bg-accent/20 data-[state=open]:text-primary-foreground"
          >
            <span>{title}</span>
            { 
              column.getCanSort() && column.getIsSorted() === "desc" ? (
                <ArrowDownIcon className="ml-2 size-4" aria-hidden="true" />
              ) : column.getIsSorted() === "asc" ? (
                <ArrowUpIcon className="ml-2 size-4" aria-hidden="true" />
              ) : (
                <CaretSortIcon className="ml-2 size-4" aria-hidden="true" />
              )
            }
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {
            column.getCanSort() && (
              <>
                <DropdownMenuItem
                  aria-label="Sort ascending"
                  onClick={() => column.toggleSorting(false)}
                >
                  <ArrowUpIcon
                    className="mr-2 size-3.5 text-muted-foreground/70"
                    aria-hidden="true"
                  />
                  Asc
                </DropdownMenuItem>
                <DropdownMenuItem
                  aria-label="Sort descending"
                  onClick={() => column.toggleSorting(true)}
                >
                  <ArrowDownIcon
                    className="mr-2 size-3.5 text-muted-foreground/70"
                    aria-hidden="true"
                  />
                  Desc
                </DropdownMenuItem>
              </>
            )
          }
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}