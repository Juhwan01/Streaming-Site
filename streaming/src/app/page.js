// pages/index.jsx
"use client";
import { useState } from 'react';
import Home from '@/components/Home';
import SideBar from '@/components/SideBar';
import Header from '@/components/Header';

export default function HomePage() {
  const [sideBarOpen, setSideBarOpen] = useState(false);

  return (
    <div className='w-full h-full'>
      <Header sideBarOpen={sideBarOpen} setSideBarOpen={setSideBarOpen} />
      <div className='min-w-screen w-auto over h-screen flex flex-row bg-slate-500'>
        <SideBar isOpen={sideBarOpen} />
        <Home />
      </div>
    </div>
  );
}