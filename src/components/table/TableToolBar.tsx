import { ArrowUpDown, ChevronDown, ExternalLink, EyeOff, ListChevronsUpDown, ListFilter, Menu, PaintBucket, Search, SquareLibrary, Table2 } from "lucide-react";

export function TableToolBar() {
  return (
    <div className="h-12 flex flex-row justify-between items-center border-b border-gray-300 bg-white  sticky top-22 z-50">

      <div className="p-5 flex flex-row items-center">
        <button className="p-2 rounded-md hover:bg-gray-100">
          <Menu size={16} />
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
        <button className="p-2 rounded-sm flex flex-row items-center gap-2 hover:bg-gray-100">
          <ListFilter size={14} />
          <div className="text-xs ">Filter</div>
        </button>
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