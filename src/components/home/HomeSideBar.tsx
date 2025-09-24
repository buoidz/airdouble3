import React from "react";
import { BookOpen, ChevronDown, ChevronRight, Download, House, Plus, ShoppingBag, SquareArrowOutUpRight, Star, UsersRound } from "lucide-react";
import { api } from "~/utils/api";
import { useRouter } from "next/router";

export function HomeSideBar() {
  const utils = api.useUtils();
  const router = useRouter();

  const createTableMutation = api.base.createBase.useMutation({
    onSuccess: (newBase) => {
      void utils.base.getAllBases.invalidate();
      void router.push(`/${newBase.id}`);
    },
    onError: (e) => {
      const errorMessage = e.data?.zodError?.fieldErrors.name;
      if (errorMessage) {
        alert(errorMessage);
      } else {
        alert("Failed to create base. Please try again later.");
      }
    },
  });

  return (
    <div className="h-full w-75 border-r-2 border-gray-200 flex flex-col items-center justify-between sticky top-14 z-10">
      <div className="flex flex-col items-center m-3 gap-1 font-medium text-[15px]">
        
        <div className="h-10 w-70 bg-gray-100 rounded-md hover:bg-gray-100 text-black flex flex-row justify-between items-center px-4 hover:cursor-pointer">
          <div className="flex flex-row items-center gap-2 ">
            <House size={18} />
            Home
          </div>
        </div>

        <div className="h-10 w-70 rounded-md hover:bg-gray-100 text-black flex flex-row justify-between items-center px-4 hover:cursor-pointer">
          <div className="flex flex-row items-center gap-2">
            <Star size={18} />
            Starred
          </div>
          <div className="flex flex-row items-center gap-2">
            <ChevronDown size={16} />
          </div>
        </div>

        <div className="h-8 w-70 rounded-md hover:bg-gray-100 text-black flex flex-row justify-between items-center px-4 gap-3">
          <button className="border border-gray-200 text-gray-400 rounded-xs p-2">
            <Star size={14} />
          </button>
          <span className="text-[11px] text-gray-500 leading-[0.8rem] font-normal">Your starred bases, interfaces, and workspaces will appear here</span>
        </div>

        <div className="h-10 w-70 rounded-md hover:bg-gray-100 text-black flex flex-row justify-between items-center px-4 hover:cursor-pointer">
          <div className="flex flex-row items-center gap-2">
            <SquareArrowOutUpRight size={18} />
            Shared
          </div>
        </div>

        <div className="h-10 w-70 rounded-md hover:bg-gray-100 text-black flex flex-row justify-between items-center px-4 hover:cursor-pointer">
          <div className="flex flex-row items-center gap-2">
            <UsersRound size={18} />
            Workspaces
          </div>
          <div className="flex flex-row items-center gap-2">
            <Plus size={16} />
            <ChevronRight size={16} />
          </div>
        </div>

      </div>

      <div className="flex flex-col items-center m-3">
        <div className="mb-4 w-65 border border-gray-100"></div>
        <div className="h-8 w-70 text-black text-xs flex flex-row items-center px-4 gap-2  hover:cursor-pointer">
          <BookOpen size={14} />
          Templates and apps
        </div>

        <div className="h-8 w-70 text-black text-xs flex flex-row items-center px-4 gap-2 hover:cursor-pointer">
          <ShoppingBag size={14} />
          Marketplace
        </div>

        <div className="h-8 w-70 text-black text-xs flex flex-row items-center px-4 gap-2 hover:cursor-pointer">
          <Download size={14} />
          Import
        </div>

        <button 
          className="mt-3 mb-3 h-8 w-68 bg-blue-600 text-white text-sm font-semibold flex flex-row items-center justify-center px-4 gap-2 rounded-md hover:cursor-pointer"
          onClick={() => void createTableMutation.mutate({ name: "Untitled Base" })}
        >
          <Plus size={20} />
          Create
        </button>
      </div>

    </div>
  );
}
