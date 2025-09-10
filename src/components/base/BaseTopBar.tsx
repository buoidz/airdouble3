import { CircleFadingArrowUp, Dock, History } from "lucide-react";
import Image from "next/image";

function getRainbowColorFromId(id: string) {
  const rainbowColors = [
    "#EF4444", // red-500
    "#F97316", // orange-500
    "#EAB308", // yellow-500
    "#22C55E", // green-500
    "#3B82F6", // blue-500
    "#6366F1", // indigo-500
    "#A855F7", // purple-500
  ];

  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) % 1000000;
  }

  const colorIndex = hash % rainbowColors.length;
  return rainbowColors[colorIndex];
}

export function BaseTopBar({baseName, baseId}: {baseName: string; baseId: string}) {
  const tableColor = getRainbowColorFromId(baseId);

  return (
    <div className="h-14 bg-white border-b border-gray-200 grid grid-cols-3 items-center px-4 sticky top-0 z-10">
      <div className="flex flex-row gap-2">
        <div className="rounded-md" style={{ backgroundColor: tableColor }}>
          <Image src="/airtable-white.png" alt="Airtable Logo" className="h-6 w-6 m-1" />
        </div>
        <div className="text-black text-xl font-semibold">{baseName}</div>
      </div>

      <div className="h-full flex flex-row items-center justify-center gap-4">
        <div className="h-full text-black text-xs font-semibold flex items-center border-b-2" style={{ borderColor: tableColor }}>
          <span className="text-black text-xs font-semibold">Data</span>
        </div>
        <div className="text-gray-600 text-xs font-semibold border-b-2 border-white">Automations</div>
        <div className="text-gray-600 text-xs font-semibold border-b-2 border-white">Interfaces</div>
        <div className="text-gray-600 text-xs font-semibold border-b-2 border-white">Forms</div>
      </div>
      
      <div className="ml-auto flex flex-row items-center gap-2">
        <button className="p-1 rounded-4xl flex flex-row items-center hover:cursor-pointer hover:bg-gray-200">
          <History  className="m-1 text-gray-600 " size={14} />
        </button>

        <button className="px-3 py-2 bg-gray-300 rounded-4xl flex flex-row items-center hover:cursor-pointer hover:shadow-xs ">
          <CircleFadingArrowUp className="inline mr-2 text-white" size={16} />
          <div className="text-xs text-white">Upgrade</div>
        </button>

        <button className="px-3 py-2 border border-gray-200 bg-white rounded-md flex flex-row items-center hover:cursor-pointer hover:shadow-xs ">
          <Dock className="inline mr-2" size={16} />
          <div className="text-xs text-black">Launch</div>
        </button>

        {/* <button className="px-3 py-2 border border-gray-200 shadow-sm bg-white rounded-md flex flex-row items-center "> */}
        <button 
          className="px-3 py-2 text-xs font-semibold text-white rounded-md hover:cursor-pointer hover:shadow-xs" 
          style={{ backgroundColor: tableColor }}>
          Share
        </button>
      </div>
    </div>
  );
}