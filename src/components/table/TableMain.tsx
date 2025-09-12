import { TableViewSideBar } from "./TableViewSideBar"
import { TableListBar } from "./TableListBar"
import { TableToolBar } from "./TableToolBar";
import { TableContent } from "./TableContent";
import { api } from "~/utils/api";
import { LoadingPage } from "../LoadingPage";
import { useState } from "react";

export function TableMain({baseId}: {baseId: string}) {
  const {data: tables, isLoading} = api.base.getAllTablesBaseById.useQuery({id: baseId});
  const [selectedTableId, setSelectedTableId] = useState<string>(tables?.[0]?.id ?? "");

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
      <TableToolBar /> 
      
      <div className="h-full flex flex-row pl-85"  style={{ height: `calc(100vh - 56px - 32px - 48px)` }}>
        <TableViewSideBar />
        <TableContent tableId={selectedTableId} />
      </div>
    </div>
  );
}