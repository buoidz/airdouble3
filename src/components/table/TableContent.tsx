import { api } from "~/utils/api";
import { LoadingPage } from "../LoadingPage";
import { useMemo, useState } from "react";
import { flexRender, getCoreRowModel, useReactTable, type CellContext } from "@tanstack/react-table";



type RowData = {
  [columnId: string]: string | number;
};

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
        className="border-none bg-transparent focus:outline-none"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
      />
    </div>
  );
}


export function TableContent({tableId}: {tableId: string}) {

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
    [colData]
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

  
  if(colLoading || rowLoading){
    return <LoadingPage />
  }
  if(!rowData || rowData.length === 0 || !colData || colData.length === 0){
    return <div>No data found</div>
  }


  return (
    <div className="w-full h-screen overflow-auto">
      <table className="border-collapse">
        <thead className="sticky top-0 z-10">
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}> 
              {headerGroup.headers.map(header => (
                <th 
                  key={header.id} 
                  className="relative group border border-gray-300 px-4 py-2"
                  style={{ width: header.getSize() }}
                >
                  {/* {flexRender(header.column.columnDef.header, header.getContext())} */}
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
            </tr>
          ))}
        </thead>

        <tbody>
          {table.getRowModel().rows.map(row => (
            <tr key={row.id} style={{ height:36 }}>
              {row.getVisibleCells().map(cell => (
                <td 
                  key={cell.id} 
                  className="border border-gray-300 px-4 py-2 text-sm text-gray-800"
                  style={{ width: cell.column.getSize() }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}