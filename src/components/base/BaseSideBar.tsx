import { UserButton } from "@clerk/nextjs";
import { ArrowLeft, Bell, CircleQuestionMark } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function BaseSideBar() {
  return (
    <div className="h-full w-14 px-2 py-4 border-r border-gray-200 items-center justify-between flex flex-col fixed left-0 top-0">
      <div className="flex flex-col gap-5 items-center">
        <Link href="/" className="group relative flex items-center justify-center h-6 w-6">
          <Image 
            src="/airtable-black.svg" 
            alt="Airtable Logo" 
            width={40}
            height={40} 
            className="h-6 w-6 transition-opacity duration-200 group-hover:opacity-0" 
          />
          <ArrowLeft className="absolute h-3 w-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100 text-black" />
        </Link>
        <Image 
            src="/omni2.jpg" 
            alt="Airtable Logo" 
            width={40}
            height={40} 
            className="h-6 w-8 hover:cursor-pointer" 
          />
      </div>
      <div className="flex flex-col items-center gap-2">
        <button className="rounded-4xl hover:bg-gray-200">
          <CircleQuestionMark className="m-2 text-black" size={14} />
        </button>
        <button className="rounded-4xl hover:bg-gray-200">
          <Bell className="m-2 text-black" size={14} />
        </button>
        <UserButton />
      </div>
      
    </div>
  );
}