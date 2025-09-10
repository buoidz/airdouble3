import { UserButton } from "@clerk/nextjs";
import { Bell, CircleQuestionMark, MenuIcon, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";   

export function HomeTopBar() {
  return (
    <div className="flex h-14 items-center justify-between border border-gray-300 px-3 shadow-xs sticky top-0 z-10">
      <div className="flex items-center">
        <MenuIcon className="text-gray-400" size={18} />
        <Link href="/" className="ml-4 text-xl font-bold">
          <Image
            src="/airtable.png"
            alt="airtable logo"
            width={30}
            height={30}
          />
        </Link> 
        <div className="ml-1 text-xl font-bold text-gray-800 truncate">Airdouble</div>
      </div>

      <div className="h-8 md:w-90 rounded-4xl border border-gray-200 shadow-xs hidden md:flex items-center justify-between">
        <div className="items-center flex px-3 text-sm text-gray-500">
          <Search className="text-gray-600 m-2 inline" size={15} />
          Search...
        </div>
        <div className="text-sm text-gray-400 px-4">ctrl K</div>
      </div>

      <div className="flex items-center gap-4">
        <button className="flex items-center rounded-4xl px-3 py-1 text-sm text-gray-700 transition-colors duration-100 hover:bg-gray-200">
          <CircleQuestionMark className="mr-2 inline" size={16} />
          Help
        </button>
        <button className="rounded-4xl border-2 border-gray-200 hover:bg-gray-200">
          <Bell className="m-2 text-black" size={12} />
        </button>
        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-10 h-10",
            },
          }}
        />
      </div>
    </div>
  );
}