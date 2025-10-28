import { Column } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * DataTableColumnHeader Component
 *
 * Renders a sortable column header for TanStack Table.
 * Shows sort indicators (up/down/unsorted) and handles click events.
 *
 *
 * @example
 * {
 *   accessorKey: 'name',
 *   header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
 * }
 */

interface DataTableColumnHeaderProps<TData, TValue> extends React.HTMLAttributes<HTMLDivElement> {
    column: Column<TData, TValue>;
    title: string;
}

export function DataTableColumnHeader<TData, TValue>({
    column,
    title,
    className,
}: Readonly<DataTableColumnHeaderProps<TData, TValue>>) {
    if (!column.getCanSort()) {
        return <div className={cn(className)}>{title}</div>;
    }

    const sorted = column.getIsSorted();

    return (
        <div className={cn('flex items-center space-x-2', className)}>
            <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8 data-[state=open]:bg-accent"
                onClick={() => column.toggleSorting(sorted === 'asc')}
            >
                <span>{title}</span>
                {sorted === 'desc' ? (
                    <ArrowDown className="ml-2 h-4 w-4" />
                ) : sorted === 'asc' ? (
                    <ArrowUp className="ml-2 h-4 w-4" />
                ) : (
                    <ChevronsUpDown className="ml-2 h-4 w-4" />
                )}
            </Button>
        </div>
    );
}
