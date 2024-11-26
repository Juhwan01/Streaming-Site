'use client'
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { RiKakaoTalkFill } from "react-icons/ri";
import { SiNaver } from "react-icons/si";
import { FaApple } from "react-icons/fa";
import axios from "axios";
import Image from "next/image";
import profileImage from "@/app/assets/images/LimeCharacter.png";

const SignUp = () => {
  const router = useRouter();
  const [username, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPW] = useState('');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      console.log('선택된 파일 정보:', {
        이름: selectedFile.name,
        크기: `${(selectedFile.size / 1024).toFixed(2)}KB`,
        타입: selectedFile.type
      });
      setFile(selectedFile);
    }
  };

  const uploadImage = async () => {
    if (!file) {
      console.log('파일이 선택되지 않음');
      return null;
    }

    const formData = new FormData();
    formData.append("file", file);
    
    try {
      console.log('이미지 업로드 시작...');
      const response = await fetch("http://localhost:8001/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      const result = await response.json();
      console.log('업로드 응답:', result);
      
      // 이미지 URL에서 포트 번호를 8001로 변경
      let uploadedUrl = result.image_url;
      if (uploadedUrl.includes('localhost:8000')) {
        uploadedUrl = uploadedUrl.replace('localhost:8000', 'localhost:8001');
      }
      
      console.log('수정된 이미지 URL:', uploadedUrl);
      setImageUrl(uploadedUrl);
      return uploadedUrl;
    } catch (error) {
      console.error("이미지 업로드 에러:", error);
      throw error;
    }
  };

  const validateInputs = () => {
    if (!username || !email || !pw || !name || !bio) {
      throw new Error("모든 필드를 입력해주세요.");
    }
    if (!file) {
      throw new Error("프로필 이미지를 선택해주세요.");
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    try {
      validateInputs();

      // 이미지 업로드
      console.log('이미지 업로드 프로세스 시작');
      const uploadedImageUrl = await uploadImage();
      console.log('최종 이미지 URL:', uploadedImageUrl);

      // 회원가입 데이터 준비
      const signupData = {
        username,
        email,
        password: pw,
        full_name: name,
        bio,
        profile_picture: uploadedImageUrl
      };
      
      console.log('회원가입 요청 데이터:', signupData);

      // 회원가입 요청
      const response = await axios.post("http://localhost:8001/signup", signupData);
      console.log('회원가입 성공:', response.data);
      
      router.push('/signin');
    } catch (error) {
      console.error('회원가입 실패:', error);
      console.error('에러 세부정보:', {
        message: error.message,
        response: error.response?.data
      });
      
      // 사용자에게 보여줄 에러 메시지 설정
      if (error.response?.data?.detail?.includes("Database integrity error")) {
        setError("이미 사용 중인 사용자명 또는 이메일입니다.");
      } else {
        setError(error.message || "회원가입 중 오류가 발생했습니다.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">
        {/* 헤더 섹션 */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <Image
              src={profileImage}
              alt="Lime Logo"
              width={60}
              height={60}
              className="rounded-full"
            />
          </div>
          <span 
            onClick={() => router.push("/")}
            className="text-4xl font-bold text-lime-500 cursor-pointer hover:text-lime-600 transition-colors">
            LIME
          </span>
          <p className="text-gray-600 text-sm">새로운 스트리밍의 시작</p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-600 px-4 py-3 rounded shadow-sm">
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSignUp}>
          {/* 입력 필드 그룹 */}
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="사용자명"
                value={username}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="relative">
              <input
                type="email"
                placeholder="이메일"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="relative">
              <input
                type="password"
                placeholder="비밀번호"
                value={pw}
                onChange={(e) => setPW(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="이름"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* 성별 선택 버튼 */}
          <div className="flex justify-between gap-4">
            <button 
              type="button"
              onClick={() => setBio("남성")}
              className={`flex-1 py-3 rounded-lg font-medium transition-all
                ${bio === "남성" 
                  ? "bg-blue-500 text-white" 
                  : "bg-gray-100 text-gray-700 hover:bg-blue-50"}`}>
              남성
            </button>
            <button 
              type="button"
              onClick={() => setBio("여성")}
              className={`flex-1 py-3 rounded-lg font-medium transition-all
                ${bio === "여성" 
                  ? "bg-red-500 text-white" 
                  : "bg-gray-100 text-gray-700 hover:bg-red-50"}`}>
              여성
            </button>
            <button 
              type="button"
              onClick={() => setBio("비공개")}
              className={`flex-1 py-3 rounded-lg font-medium transition-all
                ${bio === "비공개" 
                  ? "bg-gray-800 text-white" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
              비공개
            </button>
          </div>

          {/* 파일 업로드 섹션 */}
          <div className="space-y-4">
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-all">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                  </svg>
                  <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">프로필 이미지 업로드</span></p>
                  <p className="text-xs text-gray-500">PNG, JPG (MAX. 800x400px)</p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={handleFileChange}
                  accept="image/*"
                />
              </label>
            </div>
            
            {imageUrl && (
              <div className="space-y-2">
                <div className="relative w-full h-40 rounded-lg overflow-hidden">
                  <img 
                    src={imageUrl} 
                    alt="Uploaded" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 회원가입 버튼 */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 bg-lime-500 text-white rounded-lg font-medium shadow-lg
              ${isLoading 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-lime-600 transform hover:-translate-y-0.5 transition-all'}`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin mr-2"/>
                처리중...
              </div>
            ) : '회원가입'}
          </button>
        </form>

        {/* 구분선 */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">간편 로그인</span>
          </div>
        </div>

        {/* 소셜 로그인 버튼 */}
        <div className="space-y-3">
          <button
            className="w-full py-3 flex items-center justify-center space-x-2 rounded-lg bg-[#FEE500] hover:bg-[#FDD800] text-black font-medium shadow-md hover:-translate-y-0.5 transition-all"
            onClick={() => console.log('카카오 로그인')}
          >
            <RiKakaoTalkFill className="text-2xl" />
            <span>카카오로 계속하기</span>
          </button>

          <button
            className="w-full py-3 flex items-center justify-center space-x-2 rounded-lg bg-[#03C75A] hover:bg-[#02B150] text-white font-medium shadow-md hover:-translate-y-0.5 transition-all"
            onClick={() => console.log('네이버 로그인')}
          >
            <SiNaver className="text-lg" />
            <span>네이버로 계속하기</span>
          </button>

          <button
            className="w-full py-3 flex items-center justify-center space-x-2 rounded-lg bg-black hover:bg-gray-800 text-white font-medium shadow-md hover:-translate-y-0.5 transition-all"
            onClick={() => console.log('애플 로그인')}
          >
            <FaApple className="text-2xl" />
            <span>Apple로 계속하기</span>
          </button>
        </div>

        {/* 로그인 링크 */}
        <p className="text-center text-gray-600 text-sm">
          이미 계정이 있으신가요?{' '}
          <span 
            onClick={() => router.push('/signin')}
            className="text-lime-500 font-medium cursor-pointer hover:text-lime-600 transition-colors"
          >
            로그인
          </span>
        </p>
      </div>
    </div>
  );
};

export default SignUp;