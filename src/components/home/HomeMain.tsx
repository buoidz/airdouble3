import React from "react";
import HomeTopBar from "./HomeTopBar";
import HomeSidebar from "./HomeSideBar";
import HomeContent from "./HomeContent";

const HomeMain = () => (
  <div className="min-h-screen">
    
    <HomeTopBar />

    <div className="flex flex-row overflow-hidden relative"  style={{ height: `calc(100vh - 56px)` }}>
      <HomeSidebar />
      <HomeContent />
    </div>
  </div>
);

export default HomeMain;
