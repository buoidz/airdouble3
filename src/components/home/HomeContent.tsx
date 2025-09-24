import React from "react";
import { api } from "~/utils/api";
import { LoadingPage } from "../LoadingPage";
import Link from "next/link";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { ArrowUp, ChevronDown, Ellipsis, Grid2X2, Icon, MenuIcon, Sheet, TableCellsSplit, Trash2 } from "lucide-react";
import Image from "next/image";

dayjs.extend(relativeTime);

export function getRainbowColorFromId(id: string): string {
  const rainbowColors = [
    "#EF4444", // red-500
    "#F97316", // orange-500
    "#EAB308", // yellow-500
    "#3B82F6", // blue-500
    "#6366F1", // indigo-500
    "#A855F7", // purple-500
  ];

  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) % 1000000;
  }

  const colorIndex = hash % rainbowColors.length;
  return rainbowColors[colorIndex] ?? "#EF4444";
}



export function HomeContent()  {
  const {data: bases, isLoading} = api.base.getAllBases.useQuery();

  const utils = api.useUtils();
  const deleteBaseMutation = api.base.deleteBase.useMutation({
    onSuccess: async () => {
      await utils.base.getAllBases.invalidate();
    },
  });

  const handleDeleteBase = (baseId: string) => {
    deleteBaseMutation.mutate({ baseId });
  };


  if (isLoading) {
    return <LoadingPage />;
  }

  // if (!bases || bases.length === 0) {
  //   return (
  //     <div className="flex-1 bg-gray-50 overflow-y-auto">
  //       <h1 className="py-8 px-10 text-3xl font-bold">Home</h1>
  //       <div className="mb-2 w-full flex items-center justify-center text-2xl">{"You haven't open anything recently"}</div>
  //       <div className="w-full flex items-center justify-center text-sm text-gray-500">Apps that you have recently opened will appear here.</div>
  //     </div>
  //   )
  // }

  const today = bases?.filter(base =>
    dayjs(base.updatedAt).isSame(dayjs(), 'day')
  );
  const past7Days = bases?.filter(base =>
    !dayjs(base.updatedAt).isSame(dayjs(), 'day') &&
    dayjs(base.updatedAt).isAfter(dayjs().subtract(7, 'day'))
  );
  const past30Days = bases?.filter(base =>
    !dayjs(base.updatedAt).isSame(dayjs(), 'day') &&
    !dayjs(base.updatedAt).isAfter(dayjs().subtract(7, 'day')) &&
    dayjs(base.updatedAt).isAfter(dayjs().subtract(30, 'day'))
  );

  const renderBases = (basesList: typeof bases) => {
    return (
      <div className="mx-13 flex flex-wrap gap-x-4 gap-y-4 mb-4">
        {basesList?.map((base) => (
          <>
            <div key={base.id} className="relative group w-85 h-25 flex flex-col hover:shadow-md">
              <Link
                href={`/${base.id}`}  
                key={base.id}
                className="h-25 w-full border border-gray-200 bg-white rounded-md shadow-xs flex flex-row items-center"
              >
                <div 
                  className="w-14 h-14 mx-4 rounded-xl border border-gray-300 text-white text-2xl flex items-center justify-center" 
                  style={{ backgroundColor: getRainbowColorFromId(base.id) }}>
                  {base.name.slice(0,2)}
                </div>
                <div className="mx-1 flex flex-col gap-1">
                  <div className="text-[13px] font-medium">{base.name}</div>
                  <div className="text-xs text-gray-600">Opened {dayjs(base.updatedAt).fromNow()}</div>
                </div>
              </Link>
              <Menu>
                <MenuButton className="absolute top-4 right-4 2 p-2 opacity-100 border border-gray-200 shadow-xs rounded-md group-hover:opacity-100 transition-opacity focus:ring-0 focus:outline-none hover:cursor-pointer">
                  <Ellipsis size={14} />
                </MenuButton>
                <MenuItems anchor="bottom start" className="z-10 [--anchor-gap:4px] w-60 bg-white border border-gray-300 rounded shadow-md p-2 flex flex-col items-start focus:ring-0 focus:outline-none">
                  <MenuItem>
                    <button
                      className="text-start text-sm w-full px-4 py-2 rounded-sm hover:bg-gray-100 flex flex-row items-center gap-3"
                      onClick={() => handleDeleteBase(base.id)}
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </MenuItem>
                </MenuItems>
              </Menu>
            </div>
          </>
        ))}
      </div>
    )
  };



  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto">
      <h1 className="py-7 px-12 text-[27px] font-bold">Home</h1>
      <div className="mx-13 flex flex-row gap-x-4 gap-y-4 mb-4">  
        <div className="w-full h-23 bg-white border border-gray-300 rounded-md hover:shadow hover:cursor-pointer">
          <div className="pt-3 pl-3 flex flex-row gap-1 items-center font-semibold text-[15px]">
            <Image 
              src="/omni.jpg"
              alt="omni" 
              width={40}
              height={40} 
              className="h-6 w-6 transition-opacity duration-200 group-hover:opacity-0" 
            />
            Start with Omni
          </div>
          <div className="pl-3 pr-5 p-1 text-gray-700 text-[13px]">
            Use AI to build a custom app tailored to your workflow
          </div>
        </div>
        <div className="w-full h-23 bg-white border border-gray-300 rounded-md hover:shadow hover:cursor-pointer">
          <div className="pt-3 pl-3 flex flex-row gap-2 items-center font-semibold text-[15px]">
            <Grid2X2 className="text-purple-800" size={18} />
            Start with templates
          </div>
          <div className="pl-3 pr-5 p-1 text-gray-700 text-[13px]">
            Select a template to get started and customize as you go.
          </div>
        </div>
        <div className="w-full h-23 bg-white border border-gray-300 rounded-md hover:shadow hover:cursor-pointer">
          <div className="pt-3 pl-3 flex flex-row gap-2 items-center font-semibold text-[15px]">
            <ArrowUp className="text-green-600" size={20} />
            Quickly upload
          </div>
          <div className="pl-3 pr-5 p-1 text-gray-700 text-[13px]">
            Easily migrate your existing projects in just a few minutes.
          </div>
        </div>
        <div className="w-full h-23 bg-white border border-gray-300 rounded-md hover:shadow hover:cursor-pointer">
          <div className="pt-3 pl-3 flex flex-row gap-2 items-center font-semibold text-[15px]">
            <TableCellsSplit className="text-blue-700" size={18} />
            Build an app on your own
          </div>
          <div className="pl-3 pr-5 p-1 text-gray-700 text-[13px]">
            Start with a blank app and build your ideal workflow
          </div>
        </div>   
      </div>
      <div className="pl-12 pr-15 pb-5 pt-4 flex flex-row justify-between">
        <button className="text-gray-500 hover:text-black flex flex-row items-center gap-1 hover:cursor-pointer">
          Opened anytime
          <ChevronDown size={16} />
        </button>
        <div className="text-gray-600 flex flex-row items-center hover:cursor-pointer gap-1">
          <MenuIcon size={19} />
          <button className="p-1 rounded-xl bg-gray-200 hover:cursor-pointer">
            <Grid2X2 size={19} />
          </button>
        </div>
      </div>
      {(!bases || bases.length === 0) &&    
        <>
          <div className="mb-2 w-full flex items-center justify-center text-2xl">{"You haven't open anything recently"}</div>
          <div className="w-full flex items-center justify-center text-sm text-gray-500">Apps that you have recently opened will appear here.</div>
        </>     
      }
      {today && today.length > 0 && (
        <>
          <h2 className="px-13 pb-1 text-sm text-gray-500 font-semibold mb-2">Today</h2>
          {renderBases(today)}
        </>
      )}

      {past7Days && past7Days.length > 0 && (
        <>
          <h2 className="px-13 pb-1 text-sm text-gray-500 font-semibold mb-2">Past 7 days</h2>
          {renderBases(past7Days)}
        </>
      )}

      {past30Days && past30Days.length > 0 && (
        <>
          <h2 className="px-13 pb-1 text-sm text-gray-500 font-semibold mb-2">Past 30 days</h2>
          {renderBases(past30Days)}
        </>
      )}
    </div>
  );
}

