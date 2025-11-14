import { flexRender, type Table as TanstackTable } from "@tanstack/react-table"

import { cn, getCommonPinningStyles } from "@/utils/styles"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataTablePagination } from "@/components/common/tables/data-table-pagination"
import { useTranslation } from "react-i18next"

interface DataTableProps<T> extends React.HTMLAttributes<HTMLDivElement>
{
  table: TanstackTable<T>;
  hidePaginationControls? : boolean;
  pageSizeOptions?: number[]
}

export function DataTable<T>({ table, hidePaginationControls = false, pageSizeOptions, className, ...props }: Readonly<DataTableProps<T>>)
{
  const { t } = useTranslation('common')

  return (
    <div
      className={cn("w-full space-y-2.5 overflow-auto", className)}
      {...props}
    >
      <div className="relative overflow-hidden rounded-md border scrollbar-simple">
        <Table className="scrollbar-simple">  
          <TableHeader className="bg-primary text-primary-foreground hover:bg-primary [&_tr]:border-b-0">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-primary text-primary-foreground hover:bg-primary">
                {headerGroup.headers.map((header, index) => {
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className={cn(index === 0 && header.column.getCanSort() ? "pl-4" : "")}
                      style={{
                        minWidth: header.getSize(), 
                        maxWidth: header.getSize(),
                        ...getCommonPinningStyles({ column: header.column, type: "header" }),
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  // className="min-h-[62px]"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{
                        ...getCommonPinningStyles({ column: cell.column, type: "cell" }),
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={table.getAllColumns().length}
                  className="h-24 text-center"
                >
                  {t("dataTable.noResult")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col gap-2.5">
        <DataTablePagination table={table} pageSizeOptions={pageSizeOptions} hidePaginationControls={hidePaginationControls}/>
      </div>
    </div>
  )
}
