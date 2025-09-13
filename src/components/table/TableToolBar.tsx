import { ArrowUpDown, ChevronDown, ExternalLink, EyeOff, ListChevronsUpDown, ListFilter, MenuIcon, PaintBucket, Search, SquareLibrary, Table2, Trash } from "lucide-react";
import type { FilterConfig, FilterType, SortConfig } from "./TableMain";
import { api } from "~/utils/api";
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'

type FilterMenuProps = {
  tableId: string;
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
  tableId,
  filterConfig,
  setFilterConfig,
  filterCondition,
  setFilterCondition,
}: FilterMenuProps) {

  const {data: columns} = api.table.getColumnDataByTableId.useQuery({id: tableId});


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
 
  return (
    <Menu>
      <MenuButton className="p-2 rounded-sm flex flex-row items-center gap-2 hover:bg-gray-100 focus:ring-0 focus:outline-none">
        <ListFilter size={14} />
        <div className="text-xs ">Filter</div>        
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
            <div key={index} className="px-2 py-1 flex">
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

type SortMenuProps = {
  tableId: string;
  sortConfig: SortConfig[];
  setSortConfig: React.Dispatch<React.SetStateAction<SortConfig[]>>;
};

export function SortMenu({
  tableId,
  sortConfig,
  setSortConfig,
}: SortMenuProps) {  return (
    <div></div>
  )
}

type TableToolBarProps = {
  tableId: string;
  filterConfig: FilterConfig[];
  setFilterConfig: React.Dispatch<React.SetStateAction<FilterConfig[]>>;
  filterCondition: "AND" | "OR";
  setFilterCondition: React.Dispatch<React.SetStateAction<"AND" | "OR">>;
  sortConfig: SortConfig[];
  setSortConfig: React.Dispatch<React.SetStateAction<SortConfig[]>>;
};

export function TableToolBar({
  tableId,
  filterConfig,
  setFilterConfig,
  filterCondition,
  setFilterCondition,
  sortConfig,
  setSortConfig,
}: TableToolBarProps) {

  return (
    <div className="h-12 flex flex-row justify-between items-center border-b border-gray-300 bg-white  sticky top-22 z-50">

      <div className="p-5 flex flex-row items-center">
        <button className="p-2 rounded-md hover:bg-gray-100">
          <MenuIcon size={16} />
        </button>
        <button className="m-2 p-1 rounded-sm flex flex-row items-center gap-2 hover:bg-gray-100">
          <Table2 className="text-blue-500" size={16} />
          <div className="text-xs font-semibold">Grid view</div>
          <ChevronDown size={16} />
        </button>
      </div>

      <div className="p-2 flex flex-row items-center text-gray-500 gap-3">
        <button className="p-2 rounded-sm flex flex-row items-center gap-2 hover:bg-gray-100">
          <EyeOff size={14} />
          <div className="text-xs ">Hide fields</div>
        </button>
        <FilterMenu 
          tableId={tableId}
          filterConfig={filterConfig}
          setFilterConfig={setFilterConfig}
          filterCondition={filterCondition}
          setFilterCondition={setFilterCondition}
        />
        <button className="p-2 rounded-sm flex flex-row items-center gap-2 hover:bg-gray-100">
          <SquareLibrary size={14} />
          <div className="text-xs ">Group</div>
        </button>
        <button className="p-2 rounded-sm flex flex-row items-center gap-2 hover:bg-gray-100">
          <ArrowUpDown size={14} />
          <div className="text-xs ">Sort</div>
        </button>
        <button className="p-2 rounded-sm flex flex-row items-center gap-2 hover:bg-gray-100">
          <PaintBucket size={14} />
          <div className="text-xs ">Color</div>
        </button>
        <button className="p-2 rounded-sm flex flex-row items-center gap-2 hover:bg-gray-100">
          <ListChevronsUpDown size={14} />
        </button>
        <button className="p-2 rounded-sm flex flex-row items-center gap-2 hover:bg-gray-100">
          <ExternalLink size={14} />
          <div className="text-xs ">Share and sync</div>
        </button>
        <button className="p-2 rounded-sm hover:bg-gray-100">
          <Search size={16} />
        </button>
      </div>

    </div>

  );
}