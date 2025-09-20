import { Plus, Search, Table2 } from "lucide-react";
import { api } from "~/utils/api";
import { LoadingSpinner } from "../LoadingPage";
import type { View } from "@prisma/client";
import type React from "react";

interface TableViewSideBarProps {
  tableId: string;
  views: View[];
  selectedView: View | null;
  handleSwitchView: (view: View) => void;
  isAdding100k: boolean;
}

export function TableViewSideBar({
  tableId,
  views,
  selectedView,
  handleSwitchView,
  isAdding100k,
}: TableViewSideBarProps) {
  const utils = api.useUtils();
  const addViewMutation = api.view.createView.useMutation({
    onSuccess: () => {
      void utils.view.getAllViewByTableId.invalidate();
    }
  });
  const handleAddView = () => {
    addViewMutation.mutate({ tableId: tableId, name: "Grid 1"});
  }


  return (        
    <div className="h-full w-70 bg-white border-r border-gray-300 overflow-hidden fixed left-14 top-34">
      <div className="sticky top-0 p-4 h-100 flex flex-col gap-4">
        <button 
          className={`px-2 py-1.5 flex flex-row items-center text-xs gap-2 rounded-sm hover:bg-gray-100 focus:ring-0 focus:outline-none ${
            isAdding100k ? "opacity-50 hover:cursor-not-allowed" : "hover:cursor-pointer "
          }`}
          onClick={handleAddView}
        >
          {addViewMutation.isPending ? (
            <LoadingSpinner size={16} />
          ) : (
            <Plus className="text-gray-700" size={16} />
          )}
          
          Create new...
        </button>
        <div className="px-2 flex flex-row items-center gap-2"
        >
          <Search className="text-gray-800" size={16} strokeWidth={1}/>
          <input
            type="text"
            className="flex flex-row items-center text-xs focus:ring-0 focus:outline-none"
            placeholder="Find a view"
          >
          </input>
        </div>
        <div className="flex flex-col teims-center">
          {views.map((view) => (
            <button 
              key={view.id}
              className={`px-2 py-1.5 flex flex-row items-center gap-2 text-start rounded-sm hover:bg-gray-100 ${
                view.id === selectedView?.id ? "bg-gray-100" : "bg-white"
              } ${
                isAdding100k ? "opacity-50 hover:cursor-not-allowed" : "hover:cursor-pointer "
              }`}
              onClick={() => handleSwitchView(view)}
            >
              <Table2 className="text-blue-500" size={16} />
              <span className="text-sm font-semibold">{view.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}