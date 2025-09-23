import { api } from "~/utils/api";
import { LoadingPage, LoadingSpinner } from "../LoadingPage";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from '@tanstack/react-virtual'
import { flexRender, getCoreRowModel, useReactTable, type CellContext, type VisibilityState } from "@tanstack/react-table";
import { Baseline, Hash, Plus, PlusIcon, WandSparkles } from "lucide-react";
import { ColumnType } from "@prisma/client";
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import type { FilterConfig, SortConfig } from "./TableMain";
import type { RowDataRaw } from "~/server/api/routers/table";


type CellValue = {
  value: string;
  containSearchTerm: boolean;
};


type RowData = Record<string, CellValue> & { originalRowId: string };

type PendingChange = {
  rowId: number;
  columnId: string;
  value: string;
};


type EditableCellProps = {
  initialValue: string; 
  tableId: string; 
  columnId: string; 
  rowId: number; 
  columnType: ColumnType;
  isCurrent: boolean;
  setIsEditCell: (isEditCell: boolean) => void;
  pendingChanges: PendingChange[], 
  setPendingChanges: React.Dispatch<React.SetStateAction<PendingChange[]>> 
}

function EditableCell({ 
  initialValue, 
  tableId, 
  columnId, 
  rowId, 
  columnType, 
  isCurrent, 
  setIsEditCell,
  pendingChanges,
  setPendingChanges ,
}: EditableCellProps) {
  const utils = api.useUtils();

  // Check if there's a pending change for this cell
  const pendingChange = pendingChanges.find(
    change => change.rowId === rowId && change.columnId === columnId
  );
  
  // Use pending change value if it exists, otherwise use initial value
  const displayValue = pendingChange ? pendingChange.value : initialValue;
  

  const [value, setValue] = useState(displayValue);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const divRef = useRef<HTMLDivElement>(null);

  const updateCellMutation = api.table.updateCell.useMutation({
    onSuccess: async () => {
      await utils.table.getRowDataByOperations.invalidate();
    },
    onError: () => {
      setValue(initialValue);
    },
    onSettled: () => {
      setTimeout(() => {
        setPendingChanges(prev =>
          prev.filter(
            change => !(change.rowId === rowId && change.columnId === columnId)
          )
        );
      }, 10000);
    }
  });

  useEffect(() => {
    if (!editing) {
      setValue(displayValue);

    }
  }, [displayValue, editing]);

  const commitChange = () => {
    if (value !== initialValue) {
      setPendingChanges(prev => {
        const filtered = prev.filter(change => !(change.rowId === rowId && change.columnId === columnId));
        return [...filtered, { rowId, columnId, value }];
      });
      updateCellMutation.mutate({ tableId, rowId, columnId, value });
    }
  };



  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "Escape") {
      commitChange();
      setIsEditCell(false);
      setEditing(false);
      divRef.current?.focus();
    } else if (e.key === "Tab") {
      e.preventDefault();
    }
  };

  useEffect(() => {
    if (!editing) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (divRef.current && !divRef.current.contains(event.target as Node)) {
        commitChange();
        setEditing(false);
        setIsEditCell(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [editing, commitChange, setIsEditCell]);

  useEffect(() => {
    if (isCurrent && !editing) {
      divRef.current?.focus();
    }
  }, [isCurrent, editing]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000); // 3 seconds
      return () => clearTimeout(timer);
    }
  }, [error]);




  return (
    <div className="w-full h-full overflow-hidden">
      {error && (
        <div className="p-1 z-200 border border-gray-300 bg-white rounded absolute bottom-full text-xs text-red-500 mt-1">
          {error}
        </div>
      )}
      {!editing ? (
        <div
          ref={divRef}
          tabIndex={0}
          className="w-full h-full flex items-center focus:outline-none cursor-pointer"
          onDoubleClick={() => {
            setIsEditCell(true);
            setEditing(true)
          }}
          onKeyDown={(e) => {
            if (e.key.length === 1 || e.key === "Enter" || e.key === "F2") {
              e.stopPropagation();
              setIsEditCell(true);
              setEditing(true)
              if (e.key.length === 1) {
                setValue("");
              }
            }
          }}
        >
          <span className="truncate block w-full">{value}</span>
        </div>
      ):(
        <>
          <input
            autoFocus
            className="w-full h-full border-none bg-transparent focus:outline-none"
            value={value}
            onChange={(e) => {
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
            }}
            onBlur={commitChange} 
            onKeyDown={handleKeyDown}
          />
        </>
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
    onSuccess: async() => {
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
      <MenuButton className="px-8 py-1 w-full h-full focus:ring-0 focus:outline-none  hover:cursor-pointer">
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
  isViewReady: boolean,
  isAdding100k: boolean
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
  isAdding100k,
}: TableContentProps) {
  const utils = api.useUtils();

  const [currentCell, setCurrentCell] = useState<{ row: number; col: number } | null>(null);

  const [isEditCell, setIsEditCell] = useState(false);

  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);


  const tableRef = useRef<HTMLTableElement |null >(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tableRef.current && !tableRef.current.contains(event.target as Node)) {
        setIsEditCell(false);
        setCurrentCell(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  const {data: colData, isLoading: colLoading} = api.table.getColumnDataByTableId.useQuery({id: tableId});
  const {
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage,
    isFetching,
    isLoading: rowLoading
  } = api.table.getRowDataByOperations.useInfiniteQuery(
    {
      tableId: tableId,
      filters: filterConfig,
      filterCondition: filterCondition,
      sorts: sortConfig,
      search: searchTerm,
      limit: 500
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
        colData?.map((col, colIndex) => ({
          accessorKey: col.id,
          header: col.name,
          enableResizing: true,
          size: 150,
          minSize: 50,
          maxSize: 500,
          cell: (props: CellContext<RowData & { originalRowId: string }, unknown>) => {
            const cellValue = props.getValue() as CellValue | undefined;
            
            return <EditableCell
              initialValue={cellValue?.value ?? ""}
              tableId={tableId}
              rowId={Number(props.row.id)}
              columnId={col.id}
              columnType={col.type}
              isCurrent={currentCell?.row === props.row.index && currentCell?.col === colIndex}
              setIsEditCell={setIsEditCell}
              pendingChanges={pendingChanges}
              setPendingChanges={setPendingChanges}
            />;
          },      
      })) ?? [], 
    [colData, tableId, currentCell?.row, currentCell?.col, pendingChanges]
  );

  const rows = useMemo(
    () => {
      const fieldsWithSearchTerm = new Set<string>();
      let cellsWithSearchTerm = 0;

      const mappedRows = rowData?.map((row: RowDataRaw) => {
        const rowObj: Record<string, CellValue> = {};
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

        return { ...rowObj, originalRowId: row.id } as RowData;
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
    getRowId: (row) => row.originalRowId,
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
    
    if (
      lastItem &&
      lastItem.index >= rows.length - 200 &&
      hasNextPage &&
      !isFetchingNextPage &&
      rows.length > 0
    ) {
      void fetchNextPage();
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

  const handleCellNavigation = (e: React.KeyboardEvent, currentCell: {row: number; col: number}) => {
    const { row, col } = currentCell;
    const maxCols = table.getVisibleLeafColumns().length - 1;
    const maxRows = rows.length - 1;
    if(isEditCell) return;
    switch (e.key) {
      case "ArrowRight":
        e.preventDefault();
        if (col < maxCols) {
          setCurrentCell({ row, col: col + 1 });
        } else if (row < maxRows) {
          setCurrentCell({ row: row + 1, col: 0 });
        }
        break;

      case "ArrowLeft":
        e.preventDefault();
        if (col > 0) {
          setCurrentCell({ row, col: col - 1 });
        } else if (row > 0) {
          setCurrentCell({ row: row - 1, col: maxCols });
        }
        break;

      case "ArrowDown":
        e.preventDefault();
        if (row < maxRows) {
          setCurrentCell({ row: row + 1, col });
        }
        break;

      case "ArrowUp":
        e.preventDefault();
        if (row > 0) {
          setCurrentCell({ row: row - 1, col });
        }
        break;

      case "Tab":
        e.preventDefault();
        if (!e.shiftKey) {
          if (col < maxCols) {
            setCurrentCell({ row, col: col + 1 });
          } else if (row < maxRows) {
            setCurrentCell({ row: row + 1, col: 0 });
          }
        } else {
          if (col > 0) {
            setCurrentCell({ row, col: col - 1 });
          } else if (row > 0) {
            setCurrentCell({ row: row - 1, col: maxCols });
          }
        }
        break;
        
    }
  };

const tableRenderKey = useMemo(() => 
  `${JSON.stringify(sortConfig)}-${JSON.stringify(filterConfig)}-${searchTerm}`, 
  [sortConfig, filterConfig, searchTerm]
);

  
  if(colLoading || rowLoading || !isViewReady){
    return <LoadingPage />
  }
  
  // if (isFetching && isAdding100k){
  //   return <LoadingPage />
  // }

  if(!rowData || !colData || colData.length === 0){
    return <div></div>
  }



  return (
    <div className="w-full">
      <div ref={parentRef} className="relative w-full h-full overflow-y-auto pb-40 pr-20">
        <table ref={tableRef} key={tableRenderKey} className="border-collapse" style={{ width: 'max-content', height: `${virtualizer.getTotalSize()}px`}}>
          <thead className="
            sticky top-0 bg-white z-10
            after:content-[''] 
            after:absolute after:top-0 after:left-0 after:w-full after:h-full 
            after:border-b after:border-r after:border-gray-300
            after:pointer-events-none
          ">            
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}> 
                <th className="w-25 border-b border-gray-300 sticky left-0 z-20 bg-white">{" "}</th>
                {headerGroup.headers.map((header, headerIndex) => { 
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
                      className={`relative group border-b border-gray-300 px-4 py-2 hover:bg-gray-50 
                        ${getBgColor() || (headerIndex == 0 ? "bg-white" : "")}  
                        ${
                          headerIndex === 0 ? "sticky left-25 z-20 after:content-[''] after:absolute after:top-0 after:left-0 after:w-full after:h-full after:border-r after:border-gray-300" : "border-r"
                        }`}
                      style={{ width: header.getSize() }}
                    >
                      <div 
                        className={`text-left text-sm font-medium text-black truncate`}
                        style={{ 
                          maxWidth: `${header.getSize() -34}px`,
                          minWidth: 0
                        }}
                      >
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
                <th className="border-b py-1 border-gray-300 hover:bg-gray-100">
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
                    className={`sticky left-0 text-xs font-normal text-gray-500 w-25 pr-6 py-2 border-b border-gray-300 z-20 bg-white ${
                      isFirstCellHighlighted ? 'bg-yellow-100' : ''
                    }`}
                  >
                    {virtualRow.index + 1}
                  </th>
                  {row.getVisibleCells().map((cell, colIndex) => {
                    const isHighlightedFilter = isColumnHighlightedFilter(cell.column.id)
                    const isHighlightedSort = isColumnHighlightedSort(cell.column.id);
                    const cellData = cell.getValue() as CellValue | undefined;
                    const isHighlightedSearch = cellData?.containSearchTerm ?? false;

                    const isCurrent = currentCell?.row === virtualRow.index && currentCell?.col === colIndex;
                    
                    const getBgColor = () => {
                      if (isHighlightedSearch) return 'bg-yellow-100';
                      if (isHighlightedSort) return 'bg-red-50';
                      if (isHighlightedFilter) return 'bg-green-50';
                      return '';
                    };

                    return (
                      <td 
                        key={cell.id} 
                        tabIndex={0}
                        onClick={() => setCurrentCell({ row: virtualRow.index, col: colIndex })}
                        onFocus={() => setCurrentCell({ row: virtualRow.index, col: colIndex })}
                        onKeyDown={(e) => {
                          if (!currentCell) return;
                          handleCellNavigation(e, currentCell);
                        }}
                        className={`border-b border-gray-300 px-4 text-sm text-gray-800 
                          ${getBgColor() || (colIndex == 0 ? "bg-white" : "")}
                          ${isCurrent ? "shadow-[inset_0_0_0_2px_rgb(59_130_246)]" : ""} 
                          ${colIndex == 0 ? "sticky left-25 z-20 after:content-[''] after:absolute after:top-0 after:left-0 after:w-full after:h-full after:border-r after:border-gray-300" : "border-r"}
                        `}
                        style={{ 
                          width: cell.column.getSize(), 
                          height: `${virtualRow.size}px`,   
                          maxWidth: cell.column.getSize(),
                          minWidth: cell.column.getSize()
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    )
                  })}
                </tr>
            )})}
          </tbody>
          <tfoot>
            {isFetchingNextPage && 
            <tr className="hover:bg-gray-100">
              <td 
                className="sticky left-0 border-b border-gray-300 after:content-[''] after:absolute after:top-0 after:left-0 after:w-full after:h-full after:border-r after:border-gray-300"
                colSpan={2}
              >
                <div className="py-3 pl-8 w-full h-full focus:ring-0 focus:outline-none">
                  <LoadingSpinner size={12}/>
                </div>

              </td>
              {table.getVisibleLeafColumns()
                .slice(0, table.getVisibleLeafColumns().length - 1)
                .map((col, i) => (
                  <td
                    key={col.id}
                    className="border-r border-b border-gray-300"
                  >
                  </td>
              ))}
            </tr>
            }
            <tr className="hover:bg-gray-100 hover:cursor-pointer">
              <td 
                className="sticky left-0 border-b border-gray-300 after:content-[''] after:absolute after:top-0 after:left-0 after:w-full after:h-full after:border-r after:border-gray-300 after:pointer-events-none "
                colSpan={2}
              >
                <button 
                  className="py-3 pl-8 w-full h-full focus:ring-0 focus:outline-none cursor-pointer"
                  onClick={handleAddRowMutation}
                  disabled={addRowMutation.isPending}
                >
                  {addRowMutation.isPending ? (<LoadingSpinner size={12}/>):(<Plus size={12}/>)}
                </button>
                
              </td>
              <td 
                className="sticky left-0 border-r border-b border-gray-300 " 
                colSpan={table.getVisibleLeafColumns().length-1}
              >
                <button 
                  className="w-full h-full focus:ring-0 focus:outline-none cursor-pointer"
                  onClick={handleAddRowMutation}
                  disabled={addRowMutation.isPending}
                >
                </button>
              </td>
            </tr>
          </tfoot>
          
        </table>

      </div>
      <div className="absolute left-86 bottom-7 h-10 w-32 rounded-3xl z-20 bg-white border border-gray-200 flex items-center">
        <div className="flex items-center justify-center h-full w-11 rounded-full rounded-r-none hover:bg-gray-200 hover:cursor-pointer">
          <PlusIcon className="ml-2 mr-1 text-gray-700" size={18}/>

        </div>
        <div className="h-full border-r border-gray-200" />
          
        <div className="text-[12px] flex items-center h-full w-21 gap-2 rounded-full rounded-l-none hover:bg-gray-200 hover:cursor-pointer">
          <WandSparkles className="ml-4" size={14} />
          Add...
        </div>
      </div>
      {/* <div className="absolute left-84 right-0 bottom-0 h-8 bg-white border-t border border-gray-200 text-[11px] px-2 py-1">
        {rowData.length} record{rowData.length>1 ? "s": ""}
      </div>   */}
    </div>
  );
}