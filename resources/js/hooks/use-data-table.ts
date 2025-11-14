
import { useState, useEffect} from "react"
import {
  ColumnPinningState,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type PaginationState,
  type SortingState,
  type TableOptions,
  type TableState,
} from "@tanstack/react-table"
import { useSearchParams } from "react-router-dom"
import { FilterFieldType } from "@/components/common/tables/data-table-toolbar"
//import { useMenu } from "@/stores/menu/menu-store"

export interface FilterValue<T>
{
  id: keyof T,
  type : FilterFieldType,
  value: string,
}

interface UseDataTableProps<TData> 
  extends Omit<TableOptions<TData>,
  | "pageCount"
  | "getCoreRowModel"
  | "manualFiltering"
  | "manualPagination"
  | "manualSorting">
{
  setData: (data: TData[]) => void,
  initialState?: Omit<Partial<TableState>, "sorting"> & {
    columnPinning?: ColumnPinningState
    sorting?: {
      id: Extract<keyof TData, string>
      desc: boolean
    }[]
    filter?: FilterValue<TData>[],
  },

  /**
   * If true, the URL parameters will be updated when the table state changes.
   * This is useful for maintaining the table state across page reloads or navigation.
   * 
   * Warning: 
   * 
   * set this to false if you have multiple tables on the same page,
   * so that they do not interfere with each other.
   * 
   * @default true
   * 
   */
  replaceParamOnStateChange?: boolean,

  /**
   * If true, the data will be processed by the table library (client-side).
   * This means that filtering, sorting, and pagination will be done on the client side.
   * 
   * @default false
   * 
   */
  manualProcessing?: boolean,
}

/**
 * Custom hook to manage data table state and functionality.
 * 
 * This hook provides a way to manage pagination, sorting, filtering, and data manipulation.
 * By default, this hook use server-side pagination, sorting, and filtering. If you want to use client-side processing, set `manualProcessing` to true.
 * 
 * Note: 
 * 
 * if you use server-side processing, you need to handle the data fetching and state management outside of this hook,
 * by using the `data`, `setData`, and `setPageCount` props and watch for `pagination.pageIndex`, `pagination.pageSize`, `sorting[0].id`, `sorting[0].desc`, and `filterValue` changes.
 */
export function useDataTable<TData>({
  data,
  setData,
  initialState = { 
    pagination: { 
      pageIndex: 1, 
      pageSize: 10 
    }, 
    sorting: [], 
    filter: [],
  },
  replaceParamOnStateChange = true,
  manualProcessing = false,
  ...props
}: UseDataTableProps<TData>)
{
  //const isMenulistFetching = useMenu((state) => state.isFetching);

  // ========================================================================

  // get Initial Table States from URL Params
  const [searchParams, setSearcParams] = useSearchParams();
  const pageIndex = Number(
    searchParams.get("sort") !== null && searchParams.get("sort") !== "" && replaceParamOnStateChange
    ? searchParams.get("page") 
    : initialState?.pagination?.pageIndex 
      ?? 1
  ) - 1;
  const pageSize = Number(
    searchParams.get("sort") !== null && searchParams.get("sort") !== "" && replaceParamOnStateChange
    ? searchParams.get("per_page") 
    : initialState?.pagination?.pageSize 
      ?? 10
  );
  const sort = searchParams.get("sort") !== null && searchParams.get("sort") !== "" && replaceParamOnStateChange
    ? searchParams.get("sort") 
    : initialState?.sorting?.[0]?.id 
      ?? "";
  const desc = searchParams.get("sort") !== null && searchParams.get("sort") !== "" && replaceParamOnStateChange
    ? (searchParams.get("desc") === "true") 
    : initialState?.sorting?.[0]?.desc 
      ?? false;

  const initialFilterValue = initialState?.filter ?? [];

  
  // ========================================================================

  // Table States and setState functions
  const [pageCount, setPageCount] = useState<number>(0)
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: pageIndex, // this state save page index from 0
    pageSize: pageSize,
  })
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: sort ?? "",
      desc: desc,
    },
  ])
  const [filterValue, setFilterValue] = useState<FilterValue<TData>[]>(initialFilterValue)

  const applyFilter = (value: FilterValue<TData>[]) =>
  {
    setPagination({ pageIndex: 0, pageSize: pagination.pageSize })
    setFilterValue(value)
  }

  // ========================================================================

  // Only used when manualProcessing is true

  // manual filtering state and logic
  const [dataFilterTemp, setDataFilterTemp] = useState<TData[]>(data);

  useEffect(() =>
  {
    if(manualProcessing)
    {
      var filtered: TData[] = data;
      if(filterValue.length > 0)
      {
        filtered = data.filter((row) =>
        {
          return filterValue.every((filter) =>
          {
            if(filter.type === "text")
            {
              return String(row[filter.id]).toLowerCase().includes(filter.value.toLowerCase());
            }
            else if(filter.type === "select")
            {
              return String(row[filter.id]).toLowerCase() === filter.value.toLowerCase();
            }
            return true;
          })
        });
      }
      else
      {
        filtered = data;
      }
      setDataFilterTemp(filtered);
    }
  }, [data, filterValue]);

  // =========================================================================

  const applyFilterParams = () =>
  {
    // return filterValue.reduce((acc, curr) =>
    // {
    //   acc[`filter.${String(curr.id)}`] = curr.value;
    //   return acc;
    // }, {} as { [key: string]: any });
    return {}; 
  }

  useEffect(() =>
  {
    if(replaceParamOnStateChange)
    {
      const filterParams = applyFilterParams();
      setSearcParams({ page: String(pagination.pageIndex + 1), per_page: String(pagination.pageSize), sort: String(sorting[0].id), desc: String(sorting[0].desc), ...filterParams });
    }
  }, [ pagination.pageIndex, pagination.pageSize, sorting[0].id, sorting[0].desc, filterValue])

  const table = useReactTable({
    ...props,
    data: manualProcessing ? dataFilterTemp : data,
    pageCount: manualProcessing ? undefined : pageCount,
    state: {
      pagination,
      sorting,
      columnPinning: {  
        left: initialState?.columnPinning?.left ?? [],
        right: initialState?.columnPinning?.right ?? [],
      },
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true && !manualProcessing,
    manualSorting: true && !manualProcessing,
  })

  return { 
    table,
    data,
    setData,
    filterValue,
    setFilterValue: applyFilter,
    pageCount,
    setPageCount,
    pagination: {
      pageIndex: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
    },
    setPagination: (pagination: PaginationState) => {
      setPagination({ pageIndex: pagination.pageIndex - 1, pageSize: pagination.pageSize })
    },
    sorting,
    setSorting,
  }
}