import { api, type RouterOutputs } from "~/utils/api";
import { LoadingPage, LoadingSpinner } from "../LoadingPage";
import React, { useEffect, useMemo, useState } from "react";
import { useVirtualizer } from '@tanstack/react-virtual'
import { flexRender, getCoreRowModel, useReactTable, type CellContext, type VisibilityState } from "@tanstack/react-table";
import { Baseline, Hash, Plus } from "lucide-react";
import { ColumnType } from "@prisma/client";
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import type { FilterConfig, SortConfig } from "./TableMain";
import type { RowDataRaw } from "~/server/api/routers/table";


type CellValue = {
  value: string;
  containSearchTerm: boolean;
};


type RowData = Record<string, CellValue>;


type EditableCellProps = {
  initialValue: string; 
  tableId: string; 
  columnId: string; 
  rowIndex: number; 
  columnType: ColumnType;
}

function EditableCell({ initialValue, tableId, columnId, rowIndex, columnType }: EditableCellProps) {
  const [value , setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);

  const updateCellMutation = api.table.updateCell.useMutation();

  const handleBlur = () => {
    if (value !== initialValue) {
      updateCellMutation.mutate({ tableId, rowIndex, columnId, value});
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (columnType === ColumnType.NUMBER) {
      if (newValue === "" || !isNaN(Number(newValue))) {
        setError(null);
        setValue(newValue);
      } else {
        setError("Please enter a valid number");
      }
    } else {
      setValue(newValue);
    }
  }

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000); // 3 seconds
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className="relative">

      <input
        className="w-full border-none bg-transparent focus:outline-none"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
      />
      {error && (
        <div className="p-1 border border-gray-300 bg-white rounded absolute bottom-full left-0 text-xs text-red-500 mt-1">
          {error}
        </div>
      )}
    </div>
  );
}

function AddColumnMenu({tableId}: {tableId: string}) {
  const utils = api.useUtils();

  const [nameColumnMenu, setNameColumnMenu] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [newColumnType, setNewColumnType] = useState<ColumnType | null>(null);

  const addColumnMutation = api.table.addColumns.useMutation({
    onSuccess: () => {
      void utils.table.getColumnDataByTableId.invalidate();
      void utils.table.getRowDataByOperations.invalidate();
      setNewColumnName("");
      setNewColumnType(null)
    },
    onError: (e) => {
      const errorMessage = e.data?.zodError?.fieldErrors.name;
      if (errorMessage) {
        alert(errorMessage);
      } else {
        alert("Failed to add column. Please try again later.");
      }
    },
  });

  const handleAddRowMutation = () => {
    if(newColumnName.trim() && newColumnType)
    addColumnMutation.mutate({ tableId, name: newColumnName, type: newColumnType});
    setNameColumnMenu(false);
  } ;



  return (
    <Menu>
      <MenuButton className="px-8 w-full h-full focus:ring-0 focus:outline-none">
        {addColumnMutation.isPending ? (<LoadingSpinner size={12}/>):(<Plus size={14}/>)}
        
      </MenuButton>

      {nameColumnMenu ? (
        <MenuItems 
          anchor="bottom start"
          className="px-4 py-3 z-20 [--anchor-gap:6px] w-85 border border-gray-300 rounded-md bg-white shadow-md flex flex-col items-start"
          style={{ outline: "none"}}
        >
          <MenuItem>
            <div className="w-full relative">
              <input
                type="text"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === ' ') {
                    e.stopPropagation();
                  }
                }}
                placeholder="Enter column name..."
                className="w-full p-2 border-2 border-blue-500 rounded-md"
                style={{ outline: "none"}}
              />
              <div className="w-full flex flex-row justify-end gap-2">
                <button 
                  className="mt-2 p-2 rounded-md text-black text-xs hover:bg-gray-200 focus:ring-0 focus:outline-none"
                  onClick={() => {
                    setNewColumnName("");
                    setNameColumnMenu(false);
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="mt-2 p-2 rounded-md bg-blue-500 text-white text-xs font-semibold focus:ring-0 focus:outline-none"
                  disabled={!newColumnName.trim() || addColumnMutation.isPending}
                  onClick={handleAddRowMutation}
                >
                  Save
                </button>
              </div>
            </div>
          </MenuItem>
        </MenuItems>
        ) : (
        <MenuItems 
          anchor="bottom"
          className="px-4 py-3 z-20 [--anchor-gap:10px] w-85 border border-gray-300 rounded-md bg-white shadow-md flex flex-col items-start"
          style={{ outline: "none"}}
        >
          <MenuItem>
            <div className="w-full relative">
              <div className="pb-2 text-sm text-gray-500">Standard fields</div>
              <button 
                className="w-full p-2 rounded-md text-sm text-gray hover:bg-gray-100 text-start flex flex-row items-center gap-3 focus:ring-0 focus:outline-none"
                onClick={(e) => {
                  e.stopPropagation()
                  setNameColumnMenu(true);
                  setNewColumnType(ColumnType.TEXT)
                }}
              >
                <Baseline size={16} />
                Text
              </button>
              <button 
                className="w-full p-2 rounded-md text-sm text-gray hover:bg-gray-100 text-start flex flex-row items-center gap-3 focus:ring-0 focus:outline-none"
                onClick={(e) => {
                  e.stopPropagation()
                  setNameColumnMenu(true);
                  setNewColumnType(ColumnType.NUMBER)
                }}
              >
                <Hash size={16} />
                Number
              </button>

              
            </div>
          </MenuItem>
        </MenuItems>
      )}
    </Menu>
  )
}



type TableContentProps = {
  tableId: string,
  filterConfig: FilterConfig[],
  filterCondition: "AND" | "OR",
  sortConfig: SortConfig[],
  searchTerm: string
  setNumFieldsContainSearchTerm: React.Dispatch<React.SetStateAction<number>>;
  setNumCellsContainSearchTerm: React.Dispatch<React.SetStateAction<number>>;
  columnVisibility: VisibilityState,
  setColumnVisibility: React.Dispatch<React.SetStateAction<VisibilityState>>;
  isViewReady: boolean
}



export function TableContent({
  tableId, 
  filterConfig, 
  filterCondition, 
  sortConfig, 
  searchTerm,
  setNumFieldsContainSearchTerm, 
  setNumCellsContainSearchTerm,
  columnVisibility,
  setColumnVisibility,
  isViewReady,
}: TableContentProps) {
  const utils = api.useUtils();

  const {data: colData, isLoading: colLoading} = api.table.getColumnDataByTableId.useQuery({id: tableId});
  const {
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage,
    isLoading: rowLoading
  } = api.table.getRowDataByOperations.useInfiniteQuery(
    {
      tableId: tableId,
      filters: filterConfig,
      filterCondition: filterCondition,
      sorts: sortConfig,
      search: searchTerm,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: isViewReady
    }
  );

  const rowData = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap(page => page.cleanRows);
  }, [data]);


  const columns = useMemo(
    () => 
        colData?.map((col) => ({
          accessorKey: col.id,
          header: col.name,
          enableResizing: true,
          size: 150,
          minSize: 50,
          maxSize: 500,
          cell: (props: CellContext<RowData, unknown>) => {
            const cellValue = props.getValue() as CellValue | undefined;
            return <EditableCell
              initialValue={cellValue?.value ?? ""}
              tableId={tableId}
              rowIndex={props.row.index}
              columnId={col.id}
              columnType={col.type}
            />;
          },      
      })) ?? [], 
    [colData, tableId]
  );

  const rows = useMemo(
    () => {
      const fieldsWithSearchTerm = new Set<string>();
      let cellsWithSearchTerm = 0;

      const mappedRows = rowData?.map((row: RowDataRaw) => {
        const rowObj: RowData = {};
        row.cells.forEach((cell: { id: string; columnId: string; textValue: string | null; numberValue: number | null; containSearchTerm: true | false}) => {
          const value = cell.textValue ?? String(cell.numberValue ?? "");
          
          rowObj[cell.columnId] = {
            value: value,
            containSearchTerm: cell.containSearchTerm,
          };

          if (cell.containSearchTerm) {
            fieldsWithSearchTerm.add(cell.columnId);
            cellsWithSearchTerm += 1;
          }
        });

        return rowObj;
      }) ?? [];

      setNumFieldsContainSearchTerm?.(fieldsWithSearchTerm.size);
      setNumCellsContainSearchTerm?.(cellsWithSearchTerm);

      return mappedRows;
    }, [rowData, setNumFieldsContainSearchTerm, setNumCellsContainSearchTerm]
  );

  // All columns visible by default
  useEffect(() => {
    if (colData && colData.length > 0) {
      const initialVisibility: VisibilityState = {};
      colData.forEach((col) => {
        initialVisibility[col.id] = true;
      });
      setColumnVisibility(initialVisibility);
    }
  }, [columns, colData, setColumnVisibility]);

    
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    state: {
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
  });

  const parentRef = React.useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 34,
    overscan: 20,
  })

  useEffect(() => {
    const [lastItem] = [...virtualizer.getVirtualItems()].reverse();
    console.log("Last virtual item:", lastItem);
    console.log(rows.length)
    
    if (
      lastItem &&
      lastItem.index >= rows.length - 500 &&
      hasNextPage &&
      !isFetchingNextPage &&
      rows.length > 0
    ) {
      void fetchNextPage();
      console.log("fetchNextPage")
    }
  }, [virtualizer.getVirtualItems(), rows.length, hasNextPage, isFetchingNextPage, fetchNextPage]);




  const addRowMutation = api.table.addRow.useMutation({
    onSuccess: () => {
      void utils.table.getRowDataByOperations.invalidate();
    },
    onError: (e) => {
      const errorMessage = e.data?.zodError?.fieldErrors.name;
      if (errorMessage) {
        alert(errorMessage);
      } else {
        alert("Failed to add row. Please try again later.");
      }
    },
  });

  const handleAddRowMutation = () => {
    void addRowMutation.mutate({ tableId: tableId })
  }

  const filteredColumnIds = useMemo(
    () => new Set(filterConfig.map(filter => filter.columnId)),
    [filterConfig]
  );

  const sortedColumnIds = useMemo(
    () => new Set(sortConfig.map(sort => sort.columnId)),
    [sortConfig]
  );

  const isColumnHighlightedFilter = (columnId: string) => {
    return filteredColumnIds.has(columnId);
  };

  const isColumnHighlightedSort = (columnId: string) => {
    return sortedColumnIds.has(columnId);
  };

  const isColumnHighlightedSearch = (columnId: string) => {
    return rowData?.some((row: RowDataRaw) =>
      row.cells.some(cell => cell.columnId === columnId && cell.containSearchTerm)
    );
  };


  
  if(colLoading || rowLoading){
    return <LoadingPage />
  }
  if(!rowData || !colData || colData.length === 0){
    return <div></div>
  }



  return (
    <div className="w-full">
      <div ref={parentRef} className="w-full h-full overflow-y-auto">
        <table className="border-collapse" style={{ width: 'max-content', height: `${virtualizer.getTotalSize()}px`}}>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}> 
                <th className="w-25 border-b border-gray-300">{" "}</th>
                {headerGroup.headers.map((header) => { 
                  const isHighlightedFilter = isColumnHighlightedFilter(header.column.id)
                  const isHighlightedSort = isColumnHighlightedSort(header.column.id);
                  const isHighlightedSearch = isColumnHighlightedSearch(header.column.id);

                  const getBgColor = () => {
                    if (isHighlightedSearch) return 'bg-yellow-200';
                    if (isHighlightedSort) return 'bg-red-50';
                    if (isHighlightedFilter) return 'bg-green-50';
                    return '';
                  };

                  return (
                    <th 
                      key={header.id} 
                      className={`relative group border-r border-b border-gray-300 px-4 py-2 ${getBgColor()}`}
                      style={{ width: header.getSize() }}
                    >
                      <div className="text-left text-sm font-medium text-black truncate whitespace-nowrap overflow-hidden text-ellipsis">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </div>
                      {header.column.getCanResize() && (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className="absolute right-0 top-0 h-full w-1 bg-blue-500 cursor-col-resize opacity-0 group-hover:opacity-100 transition-opacity transition-duration-100"
                        />
                      )}
                    </th>
                  )
                })}
                <th className="border-b border-r py-1 border-gray-300 hover:bg-gray-100">
                  <AddColumnMenu tableId={tableId}/>
                </th>
              </tr>
            ))}
          </thead>

          <tbody style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const row = table.getRowModel().rows[virtualRow.index];
              if (!row) return;

              const firstCellData = row.getVisibleCells()[0]?.getValue() as CellValue;
              const isFirstCellHighlighted = firstCellData?.containSearchTerm;

              return (
                <tr 
                  key={row.id}
                  style={{
                    position: 'absolute',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <th 
                    className={`text-xs font-normal text-gray-500 w-25 pr-6 py-2 border-b border-gray-300 ${
                      isFirstCellHighlighted ? 'bg-yellow-100' : ''
                    }`}
                  >
                    {virtualRow.index + 1}
                  </th>
                  {row.getVisibleCells().map(cell => {
                    const isHighlightedFilter = isColumnHighlightedFilter(cell.column.id)
                    const isHighlightedSort = isColumnHighlightedSort(cell.column.id);
                    const cellData = cell.getValue() as CellValue | undefined;
                    const isHighlightedSearch = cellData?.containSearchTerm ?? false;


                    const getBgColor = () => {
                      if (isHighlightedSearch) return 'bg-yellow-100';
                      if (isHighlightedSort) return 'bg-red-50';
                      if (isHighlightedFilter) return 'bg-green-50';
                      return '';
                    };
                    return (
                      <td 
                        key={cell.id} 
                        className={`border-r border-b border-gray-300 px-4 text-sm text-gray-800 ${getBgColor()}`}
                        style={{ width: cell.column.getSize(), height: `${virtualRow.size}px`, }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    )
                  })}
                </tr>
            )})}
          </tbody>
          <tfoot>
            <tr>
              <td 
                className="border-r border-b border-gray-300 hover:bg-gray-100" 
                colSpan={1+table.getVisibleLeafColumns().length}
              >
                <button 
                  className="py-3 pl-8 w-full h-full focus:ring-0 focus:outline-none"
                  onClick={handleAddRowMutation}
                  disabled={addRowMutation.isPending}
                >
                  {addRowMutation.isPending ? (<LoadingSpinner size={12}/>):(<Plus size={12}/>)}
                </button>
                
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}