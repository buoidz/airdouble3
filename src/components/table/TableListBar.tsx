import { ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";
import { getRainbowColorFromId } from "../home/HomeContent";
import { lighten, rgba } from "polished";
import { api } from "~/utils/api";
import { LoadingSpinner } from "../LoadingPage";
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { useState } from "react";


type TableListBarProps = {
  tables: { id: string; name: string }[];
  baseId: string
  selectedTableId: string
  setSelectedTableId: (id: string) => void;
}


function TableMenu({tables, baseId, selectedTableId, setSelectedTableId}: TableListBarProps) {
  const utils = api.useUtils();
  const tableCorlor = lighten(0.3, getRainbowColorFromId(baseId));

  const [openRenameMenu, setOpenRenameMenu] = useState(false);
  const [newTableName, setNewTableName] = useState("");

  const renameTableMutation = api.table.renameTable.useMutation({
    onSuccess: () => {
      void utils.base.getAllTablesBaseById.invalidate();
      setNewTableName("")
    },
    onError: (e) => {
      const errorMessage = e.data?.zodError?.fieldErrors.name;
      if (errorMessage) {
        alert(errorMessage);
      } else {
        alert("Failed to create table. Please try again later.");
      }
    },
  });

  const handleRenameTable = () => {
    renameTableMutation.mutate({ baseId, tableId: selectedTableId, newName: newTableName});
    setOpenRenameMenu(false);
  }



  return (
    <div className="h-full flex relative">
      {tables.map((table, index) => {
        const isSelected = table.id === selectedTableId;
        const nextTable = tables[index + 1];
        const showSeparator = !isSelected && (!nextTable || nextTable.id !== selectedTableId);

        return (
          
          (isSelected ? (
            <Menu>
              <MenuButton 
                key={table.id}
                onClick={() => setSelectedTableId(table.id)}
                className={`h-full px-4 rounded-sm rounded-b-none  bg-white border-r border-gray-300 text-xs font-medium text-black hover:cursor-pointer whitespace-nowrap"
                  ${index===0 ? "rounded-tl-none": "border-l rounded-tl"}
                `}
                style={{ backgroundColor: "white", outline: "none"}}
              >
                <div className="flex flex-row items-center gap-1 whitespace-nowrap">
                  {table.name}
                  <ChevronDown size={16}/>
                </div>
                
              </MenuButton>

              {openRenameMenu ? (
                <MenuItems 
                  anchor="bottom start"
                  className="px-4 py-3 z-20 [--anchor-gap:6px] w-85 border border-gray-300 rounded-md bg-white shadow-md flex flex-col items-start"
                  style={{ outline: "none"}}
                >
                  <MenuItem>
                    <div className="w-full relative">
                      <input
                        type="text"
                        value={newTableName}
                        onChange={(e) => setNewTableName(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="Enter table name..."
                        className="w-full p-2 border-2 border-blue-500 rounded-md"
                        style={{ outline: "none"}}
                      />
                      <div className="w-full flex flex-row justify-end gap-2">
                        <button 
                          className="mt-2 p-2 rounded-md text-black text-xs hover:bg-gray-200"
                          onClick={() => {
                            setNewTableName("");
                            setOpenRenameMenu(false);
                          }}
                        >
                          Cancel
                        </button>
                        <button 
                          className="mt-2 p-2 rounded-md bg-blue-500 text-white text-xs font-semibold"
                          disabled={!newTableName.trim() || renameTableMutation.isPending}
                          onClick={handleRenameTable}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </MenuItem>
                </MenuItems>
                ) : (
                <MenuItems 
                  anchor="bottom start"
                  className="px-4 py-3 z-20 [--anchor-gap:6px] h-25 w-85 border border-gray-300 rounded-md bg-white shadow-md flex flex-col items-start"
                  style={{ outline: "none"}}
                >
                  <MenuItem>
                    <div className="w-full relative">
                      <button 
                        className="w-full p-2 rounded-md text-sm text-gray hover:bg-gray-100 text-start flex flex-row items-center gap-3"
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenRenameMenu(true);
                        }}
                      >
                        <Pencil size={14}/>
                        Rename Table
                      </button>

                      
                    </div>
                  </MenuItem>
                  <MenuItem>
                    <button className="w-full p-2 rounded-md text-sm text-gray hover:bg-gray-100 text-start flex flex-row items-center gap-3">
                      <Trash2 size={14}/>
                      Delete Table
                    </button>
                  </MenuItem>
                </MenuItems>
              )}
            </Menu>
          ) : (
            <button 
              key={table.id} 
              onClick={() => setSelectedTableId(table.id)}
              className="pl-4 rounded-sm rounded-b-none border-b border-gray-300 text-xs font-normal text-gray-700  hover:cursor-pointer whitespace-nowrap"
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = rgba(getRainbowColorFromId(baseId), 0.2))
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = tableCorlor)
              }
              style={{ backgroundColor: tableCorlor, outline: "none" }}
            >
              <div className="flex flex-row items-center justify-between gap-1">
                {table.name}
                <span className="ml-2"></span>
                {showSeparator && <span className="h-4 border-l border-gray-300"></span>}
              </div>
              
            </button> 
          ))
        )
      })}

      {/* {openRenameMenu && anchorRect && (
        <div 
          className="z-30 p-4 absolute rounded-md border border-gray-300 bg-white" 
          style={{
            top: anchorRect.bottom - 50,
            left: anchorRect.left - 55,
          }}
        >
          rename menu!!!!!!!
        </div>
      )} */}
    </div>
  )
}


export function TableListBar({tables, baseId, selectedTableId, setSelectedTableId}: TableListBarProps) {
  const utils = api.useUtils();


  const addTableMutation = api.table.createTableByBaseId.useMutation({
    onSuccess: () => {
      void utils.base.getAllTablesBaseById.invalidate()
    },
    onError: (e) => {
      const errorMessage = e.data?.zodError?.fieldErrors.name;
      if (errorMessage) {
        alert(errorMessage);
      } else {
        alert("Failed to create table. Please try again later.");
      }
    },
  });

  const handleAddTable = () => {
    addTableMutation.mutate({ baseId })
  }

  const tableCorlor = lighten(0.3, getRainbowColorFromId(baseId));
  console.log(tableCorlor);

  return (
    <div 
      className="h-8 flex flex-row items-center sticky top-14 z-10"
      style={{ backgroundColor: tableCorlor }}
    > 
      <TableMenu tables={tables} baseId={baseId} selectedTableId={selectedTableId} setSelectedTableId={setSelectedTableId}/>
      
      <div className="h-full w-full px-4 border-b border-gray-300 flex flex-row justify-between items-center">
        <div className="flex flex-row justify-between items-center gap-6">
          <ChevronDown className="text-black" size={16} />
          <button 
            className="text-xs font-normal text-gray-700 flex flex-row justify-between items-center gap-2 hover:cursor-pointer"
            onClick={handleAddTable}
            style={{ outline: "none"}}
          >
            {addTableMutation.isPending ? (
              <LoadingSpinner />
            ) : (
              <Plus className="text-gray-700" size={16} />
            )}
            Add or import
          </button>
        </div>
        
        <button className="text-xs font-normal text-gray-700 flex flex-row justify-between items-center">
          Tools
          <ChevronDown className="text-black" size={16} strokeWidth={1} />
        </button>
      </div>
    </div>

  );
}