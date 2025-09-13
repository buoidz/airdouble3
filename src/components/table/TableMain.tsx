import { TableViewSideBar } from "./TableViewSideBar"
import { TableListBar } from "./TableListBar"
import { TableToolBar } from "./TableToolBar";
import { TableContent } from "./TableContent";
import { api } from "~/utils/api";
import { LoadingPage } from "../LoadingPage";
import { useEffect, useState } from "react";

type SortType = "textASC" | "textDESC" | "numASC" | "numDESC";

export interface SortConfig {
  columnId: string;
  type: SortType;
}

export type FilterType = 'numGreaterThan' | 'numSmallerThan' | 'numEqualTo' | 'textNotEmpty' | 'textIsEmpty'| 'textContains' | 'textNotContains'| 'textEqualTo';

export interface FilterConfig {
  columnId: string;
  type: FilterType;
  value: string;
}


export function TableMain({baseId}: {baseId: string}) {
  const {data: tables, isLoading} = api.base.getAllTablesBaseById.useQuery({id: baseId});
  const [selectedTableId, setSelectedTableId] = useState<string>(tables?.[0]?.id ?? "");  

  const [filterConfig, setFilterConfig] = useState<FilterConfig[]>([]);
  const [filterCondition, setFilterCondition] = useState<"AND"|"OR">("AND");
  const [sortConfig, setSortConfig] = useState<SortConfig[]>([])

  const [debouncedFilters, setDebouncedFilters] = useState<FilterConfig[]>([]);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilters(filterConfig);
    }, 500);

    return () => clearTimeout(handler);
  }, [filterConfig]);

  const [debouncedSorts, setDebouncedSorts] = useState<SortConfig[]>([]);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSorts(sortConfig);
    }, 500);

    return () => clearTimeout(handler);
  }, [sortConfig]);


  if(isLoading){
    return <LoadingPage />
  }
  if(!tables || tables.length === 0 || !tables[0]){
    return <div>No table found</div>
  }


  const tableProps = tables.map((table) => ({
    id: table.id,
    name: table.name,
  }));

  return (
    <div className="w-full flex flex-col border-collapse">
      <TableListBar tables={tableProps} baseId={baseId} selectedTableId={selectedTableId} setSelectedTableId={setSelectedTableId}/>
      <TableToolBar 
        tableId={selectedTableId}
        filterConfig={debouncedFilters}
        setFilterConfig={setDebouncedFilters}
        filterCondition={filterCondition}
        setFilterCondition={setFilterCondition}
        sortConfig={debouncedSorts}
        setSortConfig={setDebouncedSorts}
      /> 
      
      <div className="h-full flex flex-row pl-85"  style={{ height: `calc(100vh - 56px - 32px - 48px)` }}>
        <TableViewSideBar />
        <TableContent tableId={selectedTableId} filterConfig={debouncedFilters} filterCondition={filterCondition} sortConfig={debouncedSorts} />
      </div>
    </div>
  );
}