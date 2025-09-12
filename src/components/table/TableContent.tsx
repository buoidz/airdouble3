import { api } from "~/utils/api";
import { LoadingPage, LoadingSpinner } from "../LoadingPage";
import { useMemo, useState } from "react";
import { flexRender, getCoreRowModel, useReactTable, type CellContext } from "@tanstack/react-table";
import { Baseline, Hash, Plus } from "lucide-react";
import { ColumnType } from "@prisma/client";
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'


type RowData = Record<string, string | number>;

function EditableCell({ initialValue, tableId, columnId, rowIndex }: { initialValue: string; tableId: string; columnId: string; rowIndex: number }) {
  const [value , setValue] = useState(initialValue);

  const updateCellMutation = api.table.updateCell.useMutation();

  const handleBlur = () => {
    if (value !== initialValue) {
      updateCellMutation.mutate({ tableId, rowIndex, columnId, value});
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  }

  return (
    <div className="relative">
      <input
        className="w-full border-none bg-transparent focus:outline-none"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
      />
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
      void utils.table.getRowDataByTableId.invalidate();
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
        {addColumnMutation.isPending ? (<LoadingSpinner size={12}/>):(<Plus size={12}/>)}
        
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


export function TableContent({tableId}: {tableId: string}) {
  const utils = api.useUtils();

  const {data: colData, isLoading: colLoading} = api.table.getColumnDataByTableId.useQuery({id: tableId});
  const {data: rowData, isLoading: rowLoading} = api.table.getRowDataByTableId.useQuery({id: tableId});

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
            const cellValue = props.getValue() as string;
            return <EditableCell
              initialValue={cellValue}
              tableId={tableId}
              rowIndex={props.row.index}
              columnId={col.id}
            />;
          },      
      })) ?? [], 
    [colData, tableId]
  );

  const rows = useMemo(
    () => 
      rowData?.map((row) => {
        const rowObj: RowData = {};
        row.cells.forEach((cell) => {
          if(cell.textValue !== null){
            rowObj[cell.columnId] = cell.textValue; 
          } else if (cell.numberValue !== null){
            rowObj[cell.columnId] = cell.numberValue;
          } else {
            rowObj[cell.columnId] = "";
          } 
        });

        return rowObj;
      }) ?? [],
    [rowData]
  );
    
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableColumnResizing: true,
    columnResizeMode: "onChange",
  });


  const addRowMutation = api.table.addRow.useMutation({
    onSuccess: () => {
      void utils.table.getRowDataByTableId.invalidate();
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

  
  if(colLoading || rowLoading){
    return <LoadingPage />
  }
  if(!rowData || rowData.length === 0 || !colData || colData.length === 0){
    return <div>No data found</div>
  }


  return (
    <div className="w-full h-screen overflow-auto">
      <div className="w-full h-full overflow-x-auto overflow-y-auto">
        <table className="border-collapse" style={{ width: 'max-content'}}>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}> 
                <th className="w-25 border-b border-gray-300"></th>
                {headerGroup.headers.map((header) => (
                  <th 
                    key={header.id} 
                    className="relative group border-r border-b border-gray-300 px-4 py-2"
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
                ))}
                <th className="border-b border-r border-gray-300 hover:bg-gray-100">
                  <AddColumnMenu tableId={tableId}/>
                </th>
              </tr>
            ))}
          </thead>

          <tbody>
            {table.getRowModel().rows.map((row, index) => (
              <tr key={row.id}>
                <th className="text-xs font-normal text-gray-500 w-25 pr-6 border-b border-gray-300">{index}</th>
                {row.getVisibleCells().map(cell => (
                  <td 
                    key={cell.id} 
                    className="border-r border-b border-gray-300 px-4 py-2 text-sm text-gray-800"
                    style={{ width: cell.column.getSize() }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
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