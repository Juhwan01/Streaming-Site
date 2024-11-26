"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import '../app/globals.css'
import { IoMdMenu } from "react-icons/io";
import { FaSearch } from "react-icons/fa";
import { BsBellFill } from "react-icons/bs";
import { SlCamrecorder } from "react-icons/sl";
import { CiMenuKebab } from "react-icons/ci";

const Header = ({ sideBarOpen, setSideBarOpen }) => {
 const [placeholder, setPlaceholder] = useState("검색");
 const [menuState, setMenuState] = useState(true);
 const [token, setToken] = useState('');
 const [isSearchOpen, setIsSearchOpen] = useState(false);
 const router = useRouter();

 const clickMenuBar = () => {
   setSideBarOpen(!sideBarOpen);
   console.log(sideBarOpen);
 }

 useEffect(() => {
   const token = localStorage.getItem('token');
   setToken(token);
 }, []);

 const handleLogout = () => {
   localStorage.removeItem('token');
   setToken(null);
   router.push('/signin');
 };

 return (
   <div className="w-full h-16 md:h-20 flex flex-row justify-between items-center bg-black px-2 md:px-4">
     {/* 로고 섹션 */}
     <div className="flex items-center gap-2 md:gap-4">
       <button
         onClick={clickMenuBar}
         className="p-2 hover:bg-gray-800 rounded-full"
       >
         <IoMdMenu className="text-xl md:text-2xl text-white" />
       </button>
       <h1
         onClick={() => router.push('/')}
         className="text-2xl md:text-4xl text-lime-500 cursor-pointer font-bold"
       >
         Lime
       </h1>
     </div>

     {/* 검색바 섹션 */}
     <div className="hidden md:flex flex-1 max-w-2xl mx-4 lg:mx-8">
       <div className="w-full h-10 bg-black flex items-center justify-around rounded-full border border-white px-4">
         <FaSearch className="text-xl text-white" />
         <input
           className="w-full h-full bg-black text-white outline-none px-4"
           type="search"
           placeholder={placeholder}
           onFocus={() => setPlaceholder("")}
           onBlur={() => setPlaceholder("검색")}
         />
       </div>
     </div>

     {/* 모바일 검색 아이콘 */}
     <button 
       className="md:hidden p-2 hover:bg-gray-800 rounded-full"
       onClick={() => setIsSearchOpen(!isSearchOpen)}
     >
       <FaSearch className="text-xl text-white" />
     </button>

     {/* 우측 메뉴 섹션 */}
     <div className="flex items-center gap-2 md:gap-4">
       <button className="p-2 hover:bg-gray-800 rounded-full hidden md:block">
         <BsBellFill className="text-xl md:text-2xl text-white" />
       </button>
       <button 
         className="p-2 hover:bg-gray-800 rounded-full"
         onClick={() => router.push("/castset")}
       >
         <SlCamrecorder className="text-xl md:text-2xl text-white" />
       </button>

       {token ? (
         <div className="flex items-center gap-2 md:gap-4">
           <button
             onClick={handleLogout}
             className="hidden md:block text-white hover:text-lime-500 transition-colors"
           >
             로그아웃
           </button>
           <button
             onClick={() => router.push('/station')}
             className="text-white hover:text-lime-500 transition-colors"
           >
             내정보
           </button>
           <button className="p-2 hover:bg-gray-800 rounded-full md:hidden">
             <CiMenuKebab className="text-xl text-white" />
           </button>
         </div>
       ) : (
         <div className="flex items-center gap-2 md:gap-4">
           <button
             onClick={() => router.push("/signin")}
             className="text-white hover:text-lime-500 transition-colors text-sm md:text-base"
           >
             로그인
           </button>
           <button
             onClick={() => router.push("/signup")}
             className="px-3 py-1.5 md:px-4 md:py-2 bg-lime-500 text-white rounded-full hover:bg-lime-600 transition-colors text-sm md:text-base"
           >
             회원가입
           </button>
         </div>
       )}
     </div>

     {/* 모바일 검색바 */}
     {isSearchOpen && (
       <div className="absolute top-16 left-0 w-full px-4 py-2 bg-black md:hidden">
         <div className="w-full h-10 bg-black flex items-center justify-around rounded-full border border-white px-4">
           <FaSearch className="text-xl text-white" />
           <input
             className="w-full h-full bg-black text-white outline-none px-4"
             type="search"
             placeholder="검색"
             autoFocus
           />
         </div>
       </div>
     )}
   </div>
 );
};

export default Header;