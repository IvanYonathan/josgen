
import { useState, Fragment } from "react"

import { cn } from "@/utils/styles"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { SearchIcon, XIcon } from "lucide-react"
import { FilterValue } from "@/hooks/use-data-table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTranslation } from "react-i18next"

export type FilterFieldType = "text" | "select"

export interface Option
{
  label: string
  value: string
  icon?: React.ComponentType<{ className?: string }>
}

export interface DataTableFilterField<TData>
{
  type: FilterFieldType
  label: string
  value: keyof TData
  placeholder?: string
  options?: Option[]
}

interface DataTableToolbarProps<TData> extends React.HTMLAttributes<HTMLDivElement>
{
  filterFields: DataTableFilterField<TData>[]
  initialDataTableFilters?: FilterValue<TData>[]
  setDataTableFilters: (value: FilterValue<TData>[]) => void
}

export function DataTableToolbar<TData>({
  filterFields,
  className,
  initialDataTableFilters = [],
  setDataTableFilters,
  ...props
}: Readonly<DataTableToolbarProps<TData>>)
{
  const { t } = useTranslation('common');
  if(filterFields.length === 0)
  {
    return (
      <div
        className={cn(
          "flex w-full items-end justify-between space-x-2 overflow-auto p-1 gap-4 scrollbar-simple",
          className
        )}
        {...props}
      >
        <div className="flex flex-1 items-end space-x-2 min-h-[50px] min-w-[1px]"/>
      </div>
    )
  }

  const [filterValue, setFilterValue] = useState<FilterValue<TData>[]>(initialDataTableFilters);
  
  const onApplyDataTableFilters = () => setDataTableFilters(filterValue);
  const onResetDataTableFilters = () => setFilterValue([])

  return (
    <div
      className={cn(
        "flex w-full items-end justify-between space-x-2 overflow-auto p-1 gap-4 scrollbar-simple",
        className
      )}
      {...props}
    >
      <div className="flex flex-1 items-end space-x-2">
        {
          filterFields.length > 0 &&
            filterFields.map((column, index) => (
              <Fragment key={index}>
              {
                column.type === "text" && (
                  <div className="flex flex-col gap-1" key={index}>
                    <Label htmlFor={String(column.value)}>{column.label}</Label>
                    <Input
                      className="h-8 w-44"
                      placeholder={column.placeholder}
                      value={filterValue.find((val) => val.id === column.value)?.value ?? ""}
                      onChange={(e) =>
                      {
                        const value = e.target.value
                        const newFilterValue = filterValue.filter((val) => val.id !== column.value)
                        if (value) newFilterValue.push({ id: column.value as keyof TData, type: 'text', value })
                        setFilterValue(newFilterValue)
                      }}
                    />
                  </div>
                )
              }
              {
                column.type === "select" && (
                  <div className="flex flex-col gap-1" key={index}>
                    <Label htmlFor={String(column.value)}>{column.label}</Label>
                    <Select
                      value={filterValue.find((val) => val.id === column.value)?.value as string ?? ""}
                      onValueChange={(value) =>
                      {
                        const newFilterValue = filterValue.filter((val) => val.id !== column.value)
                        if (value && value !== "none") newFilterValue.push({ id: column.value as keyof TData, type: 'text', value })
                        setFilterValue(newFilterValue)
                      }}
                    >
                      <SelectTrigger className="h-8 w-44" wrapperClassName="h-8 w-44">
                        <SelectValue placeholder={column.placeholder} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" defaultChecked>{t('dataTable.filter.select.nonePlaceholder')}</SelectItem>
                        {
                          column.options?.map((option, index) => (
                            <SelectItem key={index} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                  </div>
                )
              }
              {/* Faceted Filter - Not Supported Right Now */}
              {/* {
                column.type === "multi-select" && (
                  <DataTableFacetedFilter
                    key={index}
                    title={column.label}
                    selectedValues={filterValue.find((val) => val.id === column.value)?.value as string[]}
                    setSelectedValues={(values) =>
                    {
                      const newFilterValue = filterValue.filter((val) => val.id !== column.value)
                      if (values.length) newFilterValue.push({ id: column.value as keyof TData, type: 'multi-select', value: values })
                      setFilterValue(newFilterValue)
                    }}
                    options={column.options ?? []}
                  />
                )
              } */}
              </Fragment>
            ))
        }
        <Button 
          className="size-8" 
          size="icon" 
          onClick={onApplyDataTableFilters}
        >
          <SearchIcon className="size-5" />
        </Button>
        {
          filterValue.length > 0 && (
            <Button
              aria-label="Reset filters"
              variant="ghost"
              className="h-8 px-2 lg:px-3"
              onClick={onResetDataTableFilters}
            >
              {t('dataTable.filter.reset')}
              <XIcon className="ml-2 size-4" aria-hidden="true" />
            </Button>
          )
        }
      </div>
    </div>
  )
}