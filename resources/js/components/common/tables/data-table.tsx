import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    OnChangeFn,
    SortingState,
    useReactTable,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

/**
 * DataTable Component
 *
 * Reusable table component powered by TanStack Table.
 * Supports server-side and client-side sorting.
 *
 *
 * @example
 * <DataTable
 *   columns={columns}
 *   data={users}
 *   sorting={sorting}
 *   onSortingChange={setSorting}
 *   manualSorting
 * />
 */

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    sorting?: SortingState;
    onSortingChange?: OnChangeFn<SortingState>;
    manualSorting?: boolean;
    loading?: boolean;
}

export function DataTable<TData, TValue>({
    columns,
    data,
    sorting,
    onSortingChange,
    manualSorting = false,
    loading = false,
}: Readonly<DataTableProps<TData, TValue>>) {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onSortingChange,
        manualSorting,
        state: {
            sorting,
        },
    });

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                                return (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                );
                            })}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center">
                                Loading...
                            </TableCell>
                        </TableRow>
                    ) : table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center">
                                No results.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
