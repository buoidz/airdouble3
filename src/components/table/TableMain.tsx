import { TableViewSideBar } from "./TableViewSideBar"
import { TableListBar } from "./TableListBar"
import { TableToolBar } from "./TableToolBar";
import { TableContent } from "./TableContent";
import { api } from "~/utils/api";
import { LoadingPage } from "../LoadingPage";
import { useEffect, useState } from "react";

export function TableMain({baseId}: {baseId: string}) {
  const {data: tables, isLoading} = api.base.getAllTablesBaseById.useQuery({id: baseId});
  const [selectedTableId, setSelectedTableId] = useState<string>(tables?.[0]?.id ?? "");

  if(isLoading){
    return <LoadingPage />
  }
  if(!tables || tables.length === 0 || !tables[0]){
    return <div>No table found</div>
  }


  return (
    <div className="w-full flex flex-col">
      <TableListBar />
      <TableToolBar /> 
      
      <div className="flex flex-row overflow-hidden"  style={{ height: `calc(100vh - 56px - 32px - 48px)` }}>
        <TableViewSideBar />
        <TableContent tableId={selectedTableId} />
      </div>
    </div>
  );
}