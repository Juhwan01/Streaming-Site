'use client'

import React from "react";
import { useRouter } from "next/navigation";

const Join = () => {
  const router = useRouter();
  
  return (
    <div className="w-full h-1500 flex flex-col items-center justify-center bg-white">
      <div className="w-2/5 flex flex-col items-center justify-start py-20">
        <span 
          onClick={() => router.push('/')}
          className="text-4xl text-lime-500 cursor-pointer">LIME</span>
        
        <div className="w-full h-32 flex flex-col mt-5">
          <div className="w-full h-1/3 flex items-center px-20">
            <span className="text-xl">아이디</span>
          </div>
          <div className="w-full h-2/3 px-20">
            <input className="w-full h-full border rounded-md pl-5 text-xl" />
          </div>
        </div>

        <div className="w-full h-32 flex flex-col mt-5">
          <div className="w-full h-1/3 flex items-center px-20">
            <span 
              itemType="password"
              className="text-xl">비밀번호</span>
          </div>
          <div className="w-full h-2/3 px-20">
            <input className="w-full h-full border rounded-md pl-5 text-xl" />
          </div>
        </div>

        <div className="w-full h-32 flex flex-col mt-5">
          <div className="w-full h-1/3 flex items-center px-20">
            <span className="text-xl">비밀번호 재확인</span>
          </div>
          <div className="w-full h-2/3 px-20">
            <input className="w-full h-full border rounded-md pl-5 text-xl" />
          </div>
        </div>

        <div className="w-full h-32 flex flex-col mt-5">
          <div className="w-full h-1/3 flex items-center px-20">
            <span className="text-xl">이름</span>
          </div>
          <div className="w-full h-2/3 px-20">
            <input className="w-full h-full border rounded-md pl-5 text-xl" />
          </div>
        </div>

        <div className="w-full h-32 flex flex-col mt-5">
          <div className="w-full h-1/3 flex items-center px-20">
            <span className="text-xl">생년월일</span>
          </div>
          <div className="w-full h-2/3 flex items-center justify-between px-20">
            <input 
              placeholder="년(4자)"
              className="w-1/4 h-full border rounded-md pl-5 text-xl" />
            <input 
              placeholder="월"
              className="w-1/4 h-full border rounded-md pl-5 text-xl" />
            <input 
              placeholder="일"
              className="w-1/4 h-full border rounded-md pl-5 text-xl" />
          </div>
        </div>

        <div className="w-full h-32 flex flex-col mt-5">
          <div className="w-full h-1/3 flex items-center px-20">
            <span className="text-xl">성별</span>
          </div>
          <div className="w-full h-2/3 flex items-center justify-center px-20">
            <button className="w-1/2 h-full border">남성</button>
            <button className="w-1/2 h-full border">여성</button>
          </div>
        </div>

        <div className="w-full h-32 flex flex-col mt-5">
          <div className="w-full h-1/3 flex items-center px-20">
            <span className="text-xl">이메일</span>
          </div>
          <div className="w-full h-2/3 px-20">
            <input 
              placeholder="'-'없이 입력"
              className="w-full h-full border rounded-md pl-5 text-xl" />
          </div>
        </div>

        <div className="w-full h-24 flex flex-row items-center justify-between px-20 pt-5">
          <button className="w-5/12 h-full border bg-slate-300 text-white text-xl rounded-xl">이전</button>
          <button className="w-5/12 h-full border bg-lime-500 text-white text-xl rounded-xl">회원가입</button>
        </div>

      </div>
    </div>
  );
};

export default Join;