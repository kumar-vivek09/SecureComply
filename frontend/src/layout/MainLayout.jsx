import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/enterprise/Sidebar';
import TopNav from '../components/enterprise/TopNav';

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-200 font-sans flex">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64 min-h-screen relative z-10">
        <TopNav />
        <main className="p-8 flex-1 w-full max-w-[1920px] mx-auto overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
