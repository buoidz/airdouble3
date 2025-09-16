import { TableViewSideBar } from "./TableViewSideBar"
import { TableListBar } from "./TableListBar"
import { TableToolBar } from "./TableToolBar";
import { TableContent } from "./TableContent";
import { api } from "~/utils/api";
import { LoadingPage } from "../LoadingPage";
import { useEffect, useRef, useState } from "react";
import type { VisibilityState } from "@tanstack/react-table";
import type { View } from "@prisma/client";
import isEqual from "lodash/isEqual";

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
  const [isConfigInitialized, setIsConfigInitialized] = useState(false);


  useEffect(() => {
    if (views && views.length > 0 && views[0]) {
      setSelectedView(views[0]);
    }
  }, [views]);

  const [filterConfig, setFilterConfig] = useState<FilterConfig[]>([]);
  const [filterCondition, setFilterCondition] = useState<"AND"|"OR">("AND");
  const [sortConfig, setSortConfig] = useState<SortConfig[]>([])
  const [searchTerm, setSearchTerm] = useState("");
  const [numFieldsContainSearchTerm, setNumFieldsContainSearchTerm] = useState(0);
  const [numCellsContainSearchTerm, setNumCellsContainSearchTerm] = useState(0);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  useEffect(() => {
    if (selectedView) {
      setIsConfigInitialized(false);
      try {
        const savedFilterConfig: FilterConfig[] = Array.isArray(selectedView.filterConfig)
          ? (selectedView.filterConfig as unknown as FilterConfig[])
          : [];

        const savedSortConfig: SortConfig[] = Array.isArray(selectedView.sortConfig)
          ? (selectedView.sortConfig as unknown as SortConfig[])
          : [];

        const savedColumnVisibility: Record<string, boolean> =
          typeof selectedView.columnVisibility === "object" && selectedView.columnVisibility !== null
            ? (selectedView.columnVisibility as unknown as Record<string, boolean>)
            : {};

        setFilterConfig(savedFilterConfig);
        setSortConfig(savedSortConfig);
        setSearchTerm(selectedView.searchTerm ?? "");
        setFilterCondition((selectedView.filterCondition as "AND" | "OR") ?? "AND");

        setColumnVisibility(savedColumnVisibility);

        console.log("---------------------")
        console.log(savedColumnVisibility)
        console.log("---------------------")
        console.log(columnVisibility)
        console.log("---------------------")


        void utils.table.getRowDataByOperations.invalidate({
          tableId: selectedView.tableId,
          filters: savedFilterConfig,
          sorts: savedSortConfig,
          search: selectedView.searchTerm ?? "",
          filterCondition: (selectedView.filterCondition as "AND" | "OR") ?? "AND",
        });

      } catch (error) {
        console.error("Error parsing view configuration:", error);
        // Reset to defaults if something unexpected occurs
        setFilterConfig([]);
        setSortConfig([]);
        setSearchTerm("");
        setFilterCondition("AND");
        setColumnVisibility({});
      } finally {
        console.log("finish init states")
        console.log(selectedView.columnVisibility)
        console.log(columnVisibility)
        setTimeout(() => {
          setIsConfigInitialized(true);
        }, 300);
      }
    }
  }, [selectedView]);

  // useEffect(() => {
  //   if (!selectedView) return;

  //   const savedFilterConfig: FilterConfig[] = Array.isArray(selectedView.filterConfig)
  //     ? (selectedView.filterConfig as unknown as FilterConfig[])
  //     : [];

  //   const savedSortConfig: SortConfig[] = Array.isArray(selectedView.sortConfig)
  //     ? (selectedView.sortConfig as unknown as SortConfig[])
  //     : [];

  //   const savedColumnVisibility: Record<string, boolean> =
  //     typeof selectedView.columnVisibility === "object" && selectedView.columnVisibility !== null
  //       ? (selectedView.columnVisibility as unknown as Record<string, boolean>)
  //       : {};

  //   const configsMatch =
  //     isEqual(filterConfig, savedFilterConfig) &&
  //     isEqual(sortConfig, savedSortConfig) &&
  //     searchTerm === (selectedView.searchTerm ?? "") &&
  //     filterCondition === ((selectedView.filterCondition as "AND" | "OR") ?? "AND") &&
  //     isEqual(columnVisibility, savedColumnVisibility);

  //   if (configsMatch) {
  //     console.log("SET CONFIG INIT TRUE")
  //     setIsConfigInitialized(true);
  //   } else {
  //     setIsConfigInitialized(false);
  //   }
  // }, [
  //   selectedView,
  //   filterConfig,
  //   sortConfig,
  //   searchTerm,
  //   filterCondition,
  //   columnVisibility,
  // ]);

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


  const savingViewRef = useRef<string | null>(null);

  const saveViewMutation = api.view.saveView.useMutation();

  const handleSaveView = () => {
    if (!selectedView) return;

    // Prevent saving if we're in the middle of switching views
    if (savingViewRef.current && savingViewRef.current !== selectedView.id) {
      console.log("block 1")
      return;
    }
    
    savingViewRef.current = selectedView.id;
    console.log("saveView")
    console.log({
      id: selectedView.id,
      tableId: selectedTableId,
      name: selectedView.name ?? "Grid 1",
      filterConfig,
      filterCondition,
      sortConfig,
      searchTerm,
      columnVisibility,
    })

    saveViewMutation.mutate({
      id: selectedView.id,
      tableId: selectedTableId,
      name: selectedView.name ?? "Grid 1",
      filterConfig,
      filterCondition,
      sortConfig,
      searchTerm,
      columnVisibility,
    }, {
      onSuccess: () => {
        console.log("Save successful");
        savingViewRef.current = null; // Clear the ref on success
      },
      onError: (error) => {
        console.error("Save failed:", error);
        savingViewRef.current = null; // Clear the ref on error too
      }
    });
  };

  useEffect(() => {
    console.log("Save effect triggered:", { 
      selectedViewId: selectedView?.id, 
      isConfigInitialized,
      sortConfigLength: sortConfig.length,
      columnVisibilityKeys: Object.keys(columnVisibility).length
    });
    if (!selectedView || !isConfigInitialized) return;

    const timeout = setTimeout(() => {
      handleSaveView();
    }, 500);

    return () => clearTimeout(timeout);
  }, [
    selectedView?.id,
    filterConfig,
    filterCondition,
    sortConfig,
    searchTerm,
    columnVisibility,
    isConfigInitialized,
  ]);


  const handleSwitchView = (view: View) => {
    if (view.id !== selectedView?.id) {
      console.log("switch view")
      setSelectedView(view);
      // Remove duplicate config loading - let the useEffect handle it
    }
  };



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
          isConfigInitialized={isConfigInitialized}
        />
      </div>
    </div>
  );
}