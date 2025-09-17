import { ArrowUpDown, ChevronDown, CircleQuestionMark, ExternalLink, EyeOff, ListChevronsUpDown, ListFilter, ListPlus, MenuIcon, PaintBucket, Search, SquareLibrary, Table2, Trash, X } from "lucide-react";
import type { FilterConfig, FilterType, SortConfig, SortType } from "./TableMain";
import { api } from "~/utils/api";
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { ColumnType } from "@prisma/client";
import { useMemo, useState } from "react";
import type { VisibilityState } from "@tanstack/react-table";
import { LoadingSpinner } from "../LoadingPage";

type ColumnObj = {
  tableId: string;
  name: string;
  id: string;
  createdAt: Date;
  updatedAt: Date;
  type: ColumnType;
  order: number;
};


function Add100KMenu({tableId}: {tableId: string}) {
  const utils = api.useUtils();
  const addRowsMutation = api.table.add1000Rows.useMutation(); // smaller mutation
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleAddRows = async () => {
    setIsRunning(true);
    setProgress(0);

    for (let i = 0; i < 100; i++) {
      try {
        await addRowsMutation.mutateAsync({ tableId });
        setProgress((prev) => prev + 1);

        if ((i + 1) % 10 === 0) {
          await utils.table.getRowDataByOperations.invalidate();
        }
      } catch (err) {
        console.error(`Batch ${i + 1} failed`, err);
        break;
      }
    }

    await utils.table.getRowDataByOperations.invalidate(); 
    setIsRunning(false);
  };


  return (
    <button 
      className="p-2 rounded-sm flex flex-row items-center gap-2 hover:bg-gray-100 hover:cursor-pointer focus:ring-0 focus:outline-none"
      onClick={handleAddRows}
      disabled={addRowsMutation.isPending}
    >
      {isRunning ?  <LoadingSpinner /> :<ListPlus size={14} />}
      <div className="text-xs">
        {isRunning ? `Adding... (${progress}%)` : "Add 100K Rows"}
      </div>
    </button>
  )
}


type HideFieldsMenuProps = {
  columns: ColumnObj[],
  columnVisibility: VisibilityState,
  setColumnVisibility: React.Dispatch<React.SetStateAction<VisibilityState>>;
};

function HideFieldsMenu({
  columns,
  columnVisibility,
  setColumnVisibility
}: HideFieldsMenuProps) {
  const [searchTermHiddenFields, setSearchTermHiddenFields] = useState("");

  const toggleColumnVisibility = (columnId: string) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [columnId]: !prev[columnId],
    }));
  };

  const toggleShowAll = () => {
    const visibility: VisibilityState = {};
    columns.forEach((col) => {
      visibility[col.id] = true;
    })
    setColumnVisibility(visibility);
  }

  const toggleHideAll = () => {
    const visibility: VisibilityState = {};
    columns.forEach((col, index) => {
      visibility[col.id] = index === 0;
    })
    setColumnVisibility(visibility);
  }

  const numHiddenColumn = useMemo(
    () => columns.filter(col => !columnVisibility[col.id]).length,
    [columnVisibility]
  )

  const columnsSearched = useMemo(
    () =>
      columns.slice(1).filter((col) => col.name.toLowerCase().includes(searchTermHiddenFields.toLowerCase())),
    [columns, searchTermHiddenFields]
  );


  return (
    <Menu>
      <MenuButton className={`p-2 rounded-sm flex flex-row border-2 border-white items-center gap-2 hover:cursor-pointer focus:ring-0 focus:outline-none ${
        numHiddenColumn === 0 ? "hover:bg-gray-100" : "bg-blue-100 hover:border-gray-300"
      }`}
      >
        
        <EyeOff size={14} />
        {numHiddenColumn === 0 ? (
          <div className="text-xs ">Hide fields</div>
        ): (
          <div className="text-xs">{numHiddenColumn} hidden {numHiddenColumn === 1 ? "field" : "fields"}{" "}</div>
        )}
        
        
      </MenuButton>

      <MenuItems 
        anchor="bottom"
        className="[--anchor-gap:3px] z-60 w-75 rounded-md border border-gray-200 shadow-lg bg-white py-2 px-4 focus:ring-0 focus:outline-none"
      >            
        <div className="flex flex-row items-center justify-between gap-1">
          <input 
            type="text"
            value={searchTermHiddenFields}
            onChange={(e) => setSearchTermHiddenFields(e.target.value)}
            className="text-gray-500 text-xs py-2 focus:ring-0 focus:outline-none"
            placeholder="Find a fields"
          />
            
          <CircleQuestionMark className="text-gray-500" size={12} />  
        </div>
        <div className="w-full border-b-2 border-gray-300"></div>
        <div className="py-3 flex flex-col gap-1">
          {columnsSearched.map((col) => (
            <button 
              key={col.id} 
              className="px-2 text-start text-sm rounded-sm flex flex-row items-center gap-6 hover:bg-gray-100 focus:ring-0 focus:outline-none"
              onClick={() => toggleColumnVisibility(col.id)}
            >
              <div 
                className={`w-3.5 h-2 px-0.5 flex items-center rounded-xl ${
                    columnVisibility[col.id] ? "bg-green-500 " : "bg-gray-300"
                }`}
              >
                <div
                  className={`bg-white w-1.5 h-1.5 rounded-full shadow-md transform duration-100 ${
                    columnVisibility[col.id] ? "translate-x-1.5" : ""
                  }`}
                />
              </div>
              {col.name}

            </button>
          ))}
        </div>
        <div className="flex flex-row gap-2 items-center justify-center">
          <button 
            className="w-full py-1 rounded-sm bg-gray-100 text-xs text-gray-500 hover:bg-gray-200 hover:text-black focus:ring-0 focus:outline-none"
            onClick={toggleHideAll}
          >
            Hide all
          </button>
          <button 
            className="w-full py-1 rounded-sm bg-gray-100 text-xs text-gray-500 hover:bg-gray-200 hover:text-black focus:ring-0 focus:outline-none"
            onClick={toggleShowAll}
          >
            Show all
          </button>
        </div>
      </MenuItems>   
    </Menu>
  )
};


type FilterMenuProps = {
  columns: ColumnObj[];
  filterConfig: FilterConfig[];
  setFilterConfig: React.Dispatch<React.SetStateAction<FilterConfig[]>>;
  filterCondition: "AND" | "OR";
  setFilterCondition: React.Dispatch<React.SetStateAction<"AND" | "OR">>;
};

const filterTypesText: Record<string, string> = {
  textContains: "contains",
  textNotContains: "does not contain",
  textEqualTo: "equals",
  textNotEmpty: "not empty",
  textIsEmpty: "empty",
};
const filterTypesNumber: Record<string, string> = {
  numGreaterThan: "greater than",
  numSmallerThan: "smaller than",
  numEqualTo: "equals",
};
const filterConditionAll: Record<"AND" | "OR", string> = {
  AND: "and",
  OR: "or",
};

function FilterMenu({
  columns,
  filterConfig,
  setFilterConfig,
  filterCondition,
  setFilterCondition,
}: FilterMenuProps) {
  const addFilter = () => {
    const availableColumn = columns?.find((col) => !filterConfig.some((f) => f.columnId === col.id));
    if (availableColumn) {
      setFilterConfig([...filterConfig, {
        columnId: availableColumn.id,
        type: availableColumn.type === "TEXT" ? 'textContains' : 'numEqualTo',
        value: ''
      }]);
    }
  };

  const updateFilter = (index: number, field: keyof FilterConfig, val: string) => {
    setFilterConfig((prev) => {
      const newFilters = [...prev];

      if (!newFilters[index]) return prev;

      if (field === "type") {
        newFilters[index].type = val as FilterType;
      } else if (field === "columnId") {
        newFilters[index].columnId = val;
      } else if (field === "value") {
        newFilters[index].value = val;
      }

      return newFilters;
    });
  };

  const removeFilter = (index: number) => {
    setFilterConfig(filterConfig.filter((_, i) => i !== index));
  };

  const filteredColumnNames = filterConfig
    .map((filter) => columns?.find((col) => col.id === filter.columnId)?.name)
    .filter((name): name is string => !!name)
    .join(', ');
 
  return (
    <Menu>
      <MenuButton 
        className={`p-2 rounded-sm flex flex-row text-xs items-center gap-2 border-2 border-white hover:cursor-pointer focus:ring-0 focus:outline-none ${
          filterConfig.length > 0 ? 'bg-green-200  hover:border-gray-300' : 'hover:bg-gray-100'
        }`}
      >
        <ListFilter size={14} />
        {filterConfig.length > 0 ? (
          <span>Filtered by {filteredColumnNames ?? 'columns'}</span>
        ) : (
          <span>Filter</span>
        )}     
      </MenuButton>

      <MenuItems 
        anchor="bottom"
        className="[--anchor-gap:3px] z-60 rounded-md border border-gray-200 shadow-lg bg-white py-2 pl-4 pr-8 focus:outline-none"
      >
        <div className="p-2 text-xs text-gray-500">In this view, show records</div>
        {filterConfig.map((filter, index) => {
          const column = columns?.find(col => col.id === filter.columnId);
          const types = column?.type === "TEXT" ? filterTypesText : filterTypesNumber;

          return (
            <div key={filter.columnId} className="px-2 py-1 flex">
              <div className="w-full px-2">
                {index===0 && ( 
                  <div className="text-xs p-2 flex-1">
                    Where
                  </div>
                )}
                {index===1 && ( 
                  <select 
                    value={filterCondition}
                    className="text-xs w-full p-2 flex-1 border border-gray-200 rounded appearance-none" 
                    onChange={(e) => setFilterCondition(e.target.value as "AND" | "OR")}
                  >
                    {Object.keys(filterConditionAll).map((key) => (
                      <option key={key} value={key}>{filterConditionAll[key as "AND" | "OR"]}</option>
                    ))}
                  </select>
                )}
                {index>=2 && ( 
                  <div className="text-xs p-2 flex-1">
                    {filterConditionAll[filterCondition]}
                  </div>
                )}
              </div>
              
              <select
                value={filter.columnId}
                onChange={(e) => updateFilter(index, "columnId", e.target.value)}
                className="text-xs border-l border-t border-b border-gray-200 rounded-l p-2 flex-1 hover:bg-gray-100 appearance-none focus:ring-0 focus:outline-none"
              >
                <option value="">Select column</option>
                {columns?.map((col) => (
                  <option key={col.id} value={col.id}>{col.name}</option>
                ))}
              </select>


              <select
                value={filter.type}
                onChange={(e) => updateFilter(index, "type", e.target.value)}
                className="text-xs border-l border-t border-b border-gray-200 p-2 flex-1 hover:bg-gray-100 appearance-none focus:ring-0 focus:outline-none"
              >
                {Object.keys(types).map((key) => (
                    <option key={key} value={key}>{types[key]}</option>
                ))}
              </select>

              <input
                type="text"
                value={filter.value}
                onChange={(e) => updateFilter(index, "value", e.target.value)}
                placeholder="Enter a value"
                className="text-xs border-l border-t border-b border-gray-200 p-2 flex-1 hover:bg-gray-100 appearance-none focus:ring-0 focus:outline-none"
              />
              <button
                className="text-xs border border-gray-200 rounded-r p-2 flex-1 hover:bg-gray-100 appearance-none focus:ring-0 focus:outline-none"
                onClick={() => removeFilter(index)}
              >
                <Trash size={12} />
              </button>
            </div>
            )
        })}
        <button
            onClick={addFilter}
            className="p-2 text-xs text-gray-500  font-semibold hover:text-black mt-2"
          >
            + Add condition
        </button>
      </MenuItems>
    </Menu>
  )
}

const sortTypesText: Record<string, string> = {
  textASC: "A → Z",
  textDESC: "Z → A",
};
const sortTypesNumber: Record<string, string> = {
  numASC: "1 → 9",
  numDESC: "9 → 1",
};

type SortMenuProps = {
  columns: ColumnObj[];
  sortConfig: SortConfig[];
  setSortConfig: React.Dispatch<React.SetStateAction<SortConfig[]>>;
};

function SortMenu({
  columns,
  sortConfig,
  setSortConfig,
}: SortMenuProps) {  
  const utils = api.useUtils();

  const addSort = (columnId: string, colType: ColumnType) => {
    setSortConfig([...sortConfig, {
      columnId: columnId,
      type: colType===ColumnType.NUMBER ? "numASC" : "textASC",
    }]);
  };

  const addSortNoColumnId = () => {
    const availableColumn = columns?.find((col) => !sortConfig.some((f) => f.columnId === col.id));
    if (availableColumn) {
      setSortConfig([...sortConfig, {
        columnId: availableColumn.id,
        type: availableColumn.type === "TEXT" ? 'textASC' : 'numASC',
      }]);
    }
  };

  const updateSort = (index: number, field: keyof SortConfig, val: string) => {
    setSortConfig((prev) => {
      const newSorts = [...prev];

      if (!newSorts[index]) return prev;

      if (field === "type") {
        newSorts[index].type = val as SortType;
      } else if (field === "columnId") {
        newSorts[index].columnId = val;
      }

      return newSorts;
    });
  };

  const removeSort = (index: number) => {
    setSortConfig(sortConfig.filter((_, i) => i !== index));
  };
  
  const sortedColumnNames = sortConfig
    .map((sort) => columns?.find((col) => col.id === sort.columnId)?.name)
    .filter((name): name is string => !!name)
    .join(', ');

  return (
    <>
      <Menu>
        <MenuButton 
          className={`p-2 rounded-sm flex flex-row text-xs items-center gap-2 border-2 border-white hover:cursor-pointer focus:ring-0 focus:outline-none ${
            sortConfig.length > 0 ? 'bg-red-100  hover:border-gray-300' : 'hover:bg-gray-100'
          }`}
        >
          <ArrowUpDown size={14} />
          {sortConfig.length > 0 ? (
            <span>Sorted by {sortedColumnNames ?? 'columns'}</span>
          ) : (
            <span>Sort</span>
          )}              
        </MenuButton>
        {sortConfig.length === 0 ? (
          <MenuItems 
            anchor="bottom"
            className="[--anchor-gap:3px] z-60 w-80 rounded-md border border-gray-200 shadow-lg bg-white px-4 py-1 focus:outline-none"
          >
            <div className="flex flex-row items-center gap-1">
              <span className="text-gray-500 text-sm font-semibold py-2">Sort by</span>
              <CircleQuestionMark className="text-gray-500" size={12} />  
            </div>
            <div className="w-full border-b border-gray-300"></div>
            <div className="py-2 flex flex-col items-start">
              {columns?.map((col) => (
                <button 
                  key={col.id}
                  className="px-2 py-1 w-full text-start text-sm text-black rounded hover:bg-gray-100"
                  onClick={() => {addSort(col.id, col.type)}}
                >
                  {col.name}
                </button>
              ))}
            </div>
          </MenuItems>
        ) : (
          <MenuItems 
            anchor="bottom"
            className="[--anchor-gap:3px] z-60 w-110 rounded-md border border-gray-200 shadow-lg bg-white px-4 py-2 focus:outline-none"
          >
            <div className="flex flex-row items-center gap-1">
              <span className="text-gray-500 text-sm font-semibold py-2">Sort by</span>
              <CircleQuestionMark className="text-gray-500" size={12} />  
            </div>
            <div className="w-full border-b border-gray-300"></div>
            <div className="py-2 flex flex-col items-center">
              {sortConfig.map((sort, index) => {
                const column = columns?.find(col => col.id === sort.columnId);
                const types = column?.type === "TEXT" ? sortTypesText : sortTypesNumber;

                return (
                  <div key={sort.columnId} className="pt-2 flex flex-row gap-2">

                    <select
                      value={sort.columnId}
                      onChange={(e) => updateSort(index, "columnId", e.target.value)}
                      className="text-xs border border-gray-200 rounded pl-2 pr-40 py-2 flex-1 hover:bg-gray-100 appearance-none focus:ring-0 focus:outline-none"
                    >
                      <option value="">Select column</option>
                      {columns?.map((col) => (
                        <option key={col.id} value={col.id}>{col.name}</option>
                      ))}
                    </select>


                    <select
                      value={sort.type}
                      onChange={(e) => updateSort(index, "type", e.target.value)}
                      className="text-xs border border-gray-200 rounded text-start pl-2 pr-18 py-2 flex-1 hover:bg-gray-100 appearance-none focus:ring-0 focus:outline-none"
                    >
                      {Object.keys(types).map((key) => (
                          <option key={key} value={key}>{types[key]}</option>
                      ))}
                    </select>

                    <button
                      className="p-2 flex-1 text-gray-400 rounded hover:bg-gray-100 appearance-none focus:ring-0 focus:outline-none"
                      onClick={() => removeSort(index)}
                    >
                      <X size={18} strokeWidth={1}/>
                    </button>

                  </div>
                )
              })}
            </div>
            <button
              onClick={addSortNoColumnId}
              className="px-2 pb-2 text-xs text-gray-500 hover:text-black mt-2"
            >
              + Add another sort
          </button>
          </MenuItems>   
        )}
        </Menu>

    </>
  )
}

type SearchMenuProps = {
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  numFields: number;
  numCells: number
};

function SearchMenu({
  searchTerm,
  setSearchTerm,
  numFields,
  numCells,
} : SearchMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = () => {
    setSearchTerm("");
    setIsOpen(false);
  }

  const displayText = () => {
    return (
      <>
        Found {" "}
        <span className="font-bold">{numFields}</span>{" "}
        {numFields === 1 ? "field" : "fields"}{" "}
        and {" "}
        <span className="font-bold">{numCells}</span>{" "}
        {numCells === 1 ? "cell" : "cells"}{" "}
        (within {" "}
        <span className="font-bold">{numCells}</span>{" "}
        {numCells === 1 ? "record" : "records"})
      </>
    );
  };

  return (
    <Menu>
      <MenuButton 
        className={`p-2 rounded-sm focus:ring-0 focus:outline-none hover:bg-gray-100 hover:cursor-pointer ${
          searchTerm === "" ? "" : "bg-yellow-200"
        }`}
        onClick={() => setIsOpen(true)}
      >
        <Search size={16} />
      </MenuButton>
      <MenuItems
        anchor="bottom end"
        className="[--anchor-gap:4px] rounded-sm border border-gray-300 bg-white focus:outline-none focus:ring-0"
      >
        <div className="flex flex-row gap-2 justify-between items-center m-1 mr-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Find in view"
            className="w-full px-1 text-xs font-semibold text-gray-700 py-1 focus:outline-none focus:ring-0"
          />
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-800"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-2 pt-0.5 pb-1 bg-gray-100 whitespace-nowrap">
          <span className="text-[0.65rem] text-gray-700 ">{displayText()}</span>
        </div>
      </MenuItems>
    </Menu>
    
  );
}

type TableToolBarProps = {
  tableId: string;
  filterConfig: FilterConfig[];
  setFilterConfig: React.Dispatch<React.SetStateAction<FilterConfig[]>>;
  filterCondition: "AND" | "OR";
  setFilterCondition: React.Dispatch<React.SetStateAction<"AND" | "OR">>;
  sortConfig: SortConfig[];
  setSortConfig: React.Dispatch<React.SetStateAction<SortConfig[]>>;
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>
  numFieldsContainSearchTerm: number;
  numCellsContainSearchTerm: number;
  columnVisibility: VisibilityState,
  setColumnVisibility: React.Dispatch<React.SetStateAction<VisibilityState>>;
};

export function TableToolBar({
  tableId,
  filterConfig,
  setFilterConfig,
  filterCondition,
  setFilterCondition,
  sortConfig,
  setSortConfig,
  searchTerm,
  setSearchTerm,
  numFieldsContainSearchTerm,
  numCellsContainSearchTerm,
  columnVisibility,
  setColumnVisibility,
}: TableToolBarProps) {
  const {data: columns} = api.table.getColumnDataByTableId.useQuery({id: tableId});

  if (!columns) return <div className="h-12 border-b border-gray-300"/>;

  return (
    <div className="h-12 flex flex-row justify-between items-center border-b border-gray-300 bg-white  sticky top-22 z-50">

      <div className="p-5 flex flex-row items-center">
        <button className="p-2 rounded-md hover:bg-gray-100 hover:cursor-pointer">
          <MenuIcon size={16} />
        </button>
        <button className="m-2 p-1 rounded-sm flex flex-row items-center gap-2 hover:bg-gray-100 hover:cursor-pointer">
          <Table2 className="text-blue-500" size={16} />
          <div className="text-xs font-semibold">Grid view</div>
          <ChevronDown size={16} />
        </button>
      </div>

      <div className="p-2 flex flex-row items-center text-gray-500 gap-3">
        <Add100KMenu tableId={tableId} />
        <HideFieldsMenu
          columns={columns}
          columnVisibility={columnVisibility}
          setColumnVisibility={setColumnVisibility}
        />
        <FilterMenu 
          columns={columns}
          filterConfig={filterConfig}
          setFilterConfig={setFilterConfig}
          filterCondition={filterCondition}
          setFilterCondition={setFilterCondition}
        />
        <button className="p-2 rounded-sm flex flex-row items-center gap-2 hover:bg-gray-100 hover:cursor-pointer">
          <SquareLibrary size={14} />
          <div className="text-xs ">Group</div>
        </button>
        <SortMenu
          columns={columns}
          sortConfig={sortConfig}
          setSortConfig={setSortConfig}
        />
        <button className="p-2 rounded-sm flex flex-row items-center gap-2 hover:bg-gray-100 hover:cursor-pointer">
          <PaintBucket size={14} />
          <div className="text-xs ">Color</div>
        </button>
        <button className="p-2 rounded-sm flex flex-row items-center gap-2 hover:bg-gray-100 hover:cursor-pointer">
          <ListChevronsUpDown size={14} />
        </button>
        <button className="p-2 rounded-sm flex flex-row items-center gap-2 hover:bg-gray-100 hover:cursor-pointer">
          <ExternalLink size={14} />
          <div className="text-xs ">Share and sync</div>
        </button>
        <SearchMenu 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          numFields={numFieldsContainSearchTerm}
          numCells={numCellsContainSearchTerm}
        />
      </div>

    </div>

  );
}