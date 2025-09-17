import { TableViewSideBar } from "./TableViewSideBar"
import { TableListBar } from "./TableListBar"
import { TableToolBar } from "./TableToolBar";
import { TableContent } from "./TableContent";
import { api } from "~/utils/api";
import { LoadingPage } from "../LoadingPage";
import { useEffect, useMemo, useState } from "react";
import type { VisibilityState } from "@tanstack/react-table";
import type { View } from "@prisma/client";

export type SortType = "textASC" | "textDESC" | "numASC" | "numDESC";

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
  const utils = api.useUtils();
  const {data: tables, isLoading: tablesLoading} = api.base.getAllTablesBaseById.useQuery({id: baseId});
  const [selectedTableId, setSelectedTableId] = useState<string>(tables?.[0]?.id ?? "");  

  const {data: views, isLoading: viewsLoading} = api.view.getAllViewByTableId.useQuery({tableId: selectedTableId});
  const [selectedView, setSelectedView] = useState<View | null>(null);


  const [filterConfig, setFilterConfig] = useState<FilterConfig[]>([]);
  const [filterCondition, setFilterCondition] = useState<"AND"|"OR">("AND");
  const [sortConfig, setSortConfig] = useState<SortConfig[]>([])
  const [searchTerm, setSearchTerm] = useState("");
  const [numFieldsContainSearchTerm, setNumFieldsContainSearchTerm] = useState(0);
  const [numCellsContainSearchTerm, setNumCellsContainSearchTerm] = useState(0);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const [isViewReady, setIsViewReady] = useState(false);
  const saveViewMutation = api.view.saveView.useMutation({
    onSuccess: () => {
      setIsViewReady(true);
      void utils.view.getAllViewByTableId.invalidate();
    },
    onError: () => {
      setIsViewReady(true);
    },
  });

  const applyViewToState = (view: View) => {
    console.log("Applying view")
    setIsViewReady(false);
    setSelectedView(view);
    setFilterConfig(Array.isArray(view.filterConfig) ? view.filterConfig as unknown as FilterConfig[] : []);
    setFilterCondition(view.filterCondition === "OR" ? "OR" : "AND");
    setSortConfig(Array.isArray(view.sortConfig) ? view.sortConfig as unknown as SortConfig[] : []);
    setColumnVisibility(
      typeof view.columnVisibility === "object" && view.columnVisibility !== null
        ? view.columnVisibility as VisibilityState
        : {}
    );

    setTimeout(() => setIsViewReady(true), 1000);
    console.log("Done applying view")
  };


  const handleSwitchView = (view: View) => {
    applyViewToState(view);
    setSearchTerm("");
  };


  const isDirty = useMemo(() => {
    if (!selectedView) return false;
    return (
      JSON.stringify(filterConfig) !== JSON.stringify(selectedView.filterConfig ?? []) ||
      filterCondition !== (selectedView.filterCondition ?? "AND") ||
      JSON.stringify(sortConfig) !== JSON.stringify(selectedView.sortConfig ?? []) ||
      JSON.stringify(columnVisibility) !== JSON.stringify(selectedView.columnVisibility ?? {})
    );
  }, [filterConfig, filterCondition, sortConfig, columnVisibility, selectedView]);

  useEffect(() => {
    if (!selectedView || !isDirty) return;

    const timeout = setTimeout(() => {
      saveViewMutation.mutate({
        id: selectedView.id,
        tableId: selectedView.tableId,
        filterConfig,
        filterCondition,
        sortConfig,
        columnVisibility,
      });
    }, 1000); 

    return () => clearTimeout(timeout);
  }, [filterConfig, filterCondition, sortConfig, columnVisibility]);

  useEffect(() => {
    if (views && views.length > 0 && !selectedView && views[0]) {
      applyViewToState(views[0]);
    }
  }, [views]);


  const [debouncedFilters, setDebouncedFilters] = useState<FilterConfig[]>([]);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilters(filterConfig);
    }, 200);

    return () => clearTimeout(handler);
  }, [filterConfig]);

  const [debouncedSorts, setDebouncedSorts] = useState<SortConfig[]>([]);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSorts(sortConfig);
    }, 200);

    return () => clearTimeout(handler);
  }, [sortConfig]);

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 200);

    return () => clearTimeout(handler);
  }, [searchTerm]);




  if(tablesLoading || viewsLoading){
    return <LoadingPage />
  }
  if(!tables || tables.length === 0 || !tables[0]){
    return <div>No table found</div>
  }
  if(!views || views.length === 0 || !views[0]){
    return <div>No view found</div>
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
        filterConfig={filterConfig}
        setFilterConfig={setFilterConfig}
        filterCondition={filterCondition}
        setFilterCondition={setFilterCondition}
        sortConfig={sortConfig}
        setSortConfig={setSortConfig}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        numFieldsContainSearchTerm={numFieldsContainSearchTerm}
        numCellsContainSearchTerm={numCellsContainSearchTerm}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
      /> 
      
      <div className="h-full flex flex-row pl-70"  style={{ height: `calc(100vh - 56px - 32px - 48px)` }}>
        <TableViewSideBar   
          tableId={selectedTableId}
          views={views}
          selectedView={selectedView}
          handleSwitchView={handleSwitchView}
        />
        <TableContent 
          tableId={selectedTableId} 
          filterConfig={debouncedFilters} 
          filterCondition={filterCondition} 
          sortConfig={debouncedSorts} 
          searchTerm={debouncedSearchTerm}
          setNumFieldsContainSearchTerm={setNumFieldsContainSearchTerm}
          setNumCellsContainSearchTerm={setNumCellsContainSearchTerm}
          columnVisibility={columnVisibility}
          setColumnVisibility={setColumnVisibility}
          isViewReady={isViewReady}
        />
      </div>
    </div>
  );
}