import React from "react";

const HomeContent = () => (
    <div className="flex-1 bg-gray-50 overflow-y-auto">
      <h1 className="py-8 px-10 text-3xl font-bold">Home</h1>
      <div className="h-25 w-85 border border-gray-200 bg-white mx-10 rounded-md shadow-xs flex flex-row items-center">
        <div className="w-14 h-14 mx-4 rounded-xl bg-blue-400 border border-gray-300 flex items-center justify-center">a</div>
        <div className="mx-1 flex flex-col gap-1">
          <div className="text sm font-semibold">Untitled base</div>
          <div className="text-xs text-gray-600">Openned just now</div>
        </div>
      </div>
    </div>
);

export default HomeContent;
