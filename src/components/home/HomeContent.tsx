import React from "react";
import { api } from "~/utils/api";
import { LoadingPage } from "../LoadingPage";
import Link from "next/link";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export function HomeContent()  {
  const utils = api.useUtils();
  const {data: bases, isLoading} = api.base.getAllBases.useQuery();


  if (isLoading) {
    return <LoadingPage />;
  }

  if (!bases || bases.length === 0) {
    return (
      <div className="flex-1 bg-gray-50 overflow-y-auto">
        <h1 className="py-8 px-10 text-3xl font-bold">Home</h1>
        <div className="mb-2 w-full flex items-center justify-center text-2xl"> You haven't open anything recently</div>
        <div className="w-full flex items-center justify-center text-sm text-gray-500"> Apps that you have recently opened will appear here.</div>
      </div>
    )
  }


  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto">
      <h1 className="py-8 px-10 text-3xl font-bold">Home</h1>
      <div className="mx-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-4 mb-4">
        {bases.map((base) => (
          <>
            <Link
              href={`/${base.id}`}  
              key={base.id}
              className="h-25 w-full border border-gray-200 bg-white rounded-xl shadow-xs flex flex-row items-center"
            >
              <div className="w-14 h-14 mx-4 rounded-xl bg-blue-400 border border-gray-300 text-white text-2xl flex items-center justify-center">{base.name.slice(0,2)}</div>
              <div className="mx-1 flex flex-col gap-1">
                <div className="text sm font-semibold">{base.name}</div>
                <div className="text-xs text-gray-600">Opened {dayjs(base.updatedAt).fromNow()}</div>
              </div>
            </Link>
          </>
        ))}
      </div>
    </div>
  );
}

