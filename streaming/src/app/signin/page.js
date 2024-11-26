'use client'
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { RiKakaoTalkFill } from "react-icons/ri";
import { SiNaver } from "react-icons/si";
import { FaApple } from "react-icons/fa";
import axios from "axios";

const SignIn = () => {
  const router = useRouter();
  const [id, setID] = useState();
  const [pw, setPW] = useState();

  const handleSignIn = async () => {
    try {
      const formData = new URLSearchParams();
      formData.append('username', id);
      formData.append('password', pw);
      formData.append('grant_type', 'password');
      
      const response = await axios.post('http://localhost:8001/login',
        formData.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        router.push('/');
      }
    } catch(error) {
      console.log('에러내용:', error);
    }
  }

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-white p-4">
      <div className="w-full flex flex-col justify-around max-w-md h-auto md:h-[600px] p-4 shadow-xl">
        {/* 상단 섹션 */}
        <div className="w-full h-auto md:h-1/2 flex flex-col items-center justify-center space-y-8">
          {/* 로고와 안내 텍스트 */}
          <div className="w-full text-center space-y-4">
            <span 
              onClick={() => router.push("/")}
              className="text-3xl text-lime-500 cursor-pointer">LIME</span>
            <p className="text-base md:text-xl">로그인 후 이용하실 수 있습니다.</p>
          </div>

          {/* 로그인 폼 */}
          <div className="w-full space-y-4">
            <input
              type="text"
              onChange={(e) => setID(e.target.value)}
              className="w-full h-12 px-4 rounded-md border"
              placeholder="아이디"
            />
            <input
              type="password"
              onChange={(e) => setPW(e.target.value)}
              className="w-full h-12 px-4 rounded-md border"
              placeholder="비밀번호"
            />
            <button
              className="w-full h-12 text-white text-xl rounded-md bg-lime-500 hover:bg-lime-600 transition-colors"
              onClick={handleSignIn}
            >
              로그인
            </button>
          </div>

          {/* 체크박스와 링크 */}
          <div className="w-full space-y-4">
            <div className="flex flex-wrap justify-around text-sm text-slate-400 gap-2">
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="rounded"/>
                <span>로그인 상태 유지</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="rounded"/>
                <span>아이디 저장</span>
              </label>
            </div>
            
            <div className="flex justify-around text-sm text-slate-300">
              <button className="hover:text-slate-400">아이디 찾기</button>
              <span>|</span>
              <button className="hover:text-slate-400">비밀번호 찾기</button>
              <span>|</span>
              <button 
                onClick={() => router.push('/signup')}
                className="hover:text-slate-400"
              >
                회원가입
              </button>
            </div>
          </div>
        </div>

        {/* 소셜 로그인 버튼 */}
        <div className="w-full mt-8 space-y-4">
          <button className="w-full h-12 flex items-center justify-center space-x-4 px-4 text-black rounded-md bg-[#FEE500] hover:bg-[#FDD800] transition-colors">
            <RiKakaoTalkFill className="text-2xl"/>
            <span>카카오로 로그인</span>
          </button>
          <button className="w-full h-12 flex items-center justify-center space-x-4 px-4 text-white rounded-md bg-[#03C75A] hover:bg-[#02B351] transition-colors">
            <SiNaver className="text-lg"/>
            <span>네이버로 로그인</span>
          </button>
          <button className="w-full h-12 flex items-center justify-center space-x-4 px-4 text-white rounded-md bg-black hover:bg-gray-800 transition-colors">
            <FaApple className="text-2xl"/>
            <span>애플로 로그인</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignIn;