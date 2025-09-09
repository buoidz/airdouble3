import React from "react";
import { HomeSideBar } from "./HomeSideBar";
import { HomeTopBar } from "./HomeTopBar";
import { HomeContent } from "./HomeContent";

export function HomeMain () {
  return (
    <div className="min-h-screen">
      
      <HomeTopBar />

      <div className="flex flex-row overflow-hidden relative"  style={{ height: `calc(100vh - 56px)` }}>
        <HomeSideBar />
        <HomeContent />
      </div>
    </div>
  );
}
