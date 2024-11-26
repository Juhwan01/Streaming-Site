"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const AddStreamKey = () => {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [streamKey, setStreamKey] = useState("");
  const [selectedGame, setSelectedGame] = useState(""); // 게임 선택을 위한 state
  const [title, setTitle] = useState("");
  const [contents, setContents] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (!savedToken) {
      router.push("/signin");
    } else {
      setToken(savedToken);
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // 게임이 선택되지 않았을 경우 에러 처리
    if (!selectedGame) {
      setError("게임을 선택해주세요.");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:8001/add_stream_key",
        {
          streamKey,
          tags: [selectedGame], // 선택된 게임을 태그 배열로 전송
          title,
          contents,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Response Data:", response.data);
      alert("스트리밍 키가 성공적으로 추가되었습니다!");
      router.push("/");
    } catch (err) {
      console.error("Error:", err);
      setError(err.response?.data?.detail || "에러가 발생했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <form
        className="bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-md"
        onSubmit={handleSubmit}
      >
        <h2 className="text-2xl font-bold mb-6 text-center">스트리밍 설정</h2>

        {error && (
          <p className="bg-red-500 text-white p-2 mb-4 rounded">{error}</p>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">스트리밍 키</label>
          <input
            type="text"
            value={streamKey}
            onChange={(e) => setStreamKey(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none"
            placeholder="스트리밍 키 입력"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">게임 선택</label>
          <div className="space-y-2">
            <select
              value={selectedGame}
              onChange={(e) => setSelectedGame(e.target.value)}
              className="w-full p-3 bg-zinc-800 rounded-lg border border-zinc-700 
                        focus:outline-none focus:ring-2 focus:ring-lime-500"
              required
            >
              <option value="">게임 선택</option>
              <option value="zelda">The Legend of Zelda: Breath of the Wild</option>
              <option value="darksouls">Dark Souls</option>
              <option value="cod">Call of Duty</option>
              <option value="fortnite">Fortnite</option>
              <option value="minecraft">Minecraft</option>
              <option value="lol">League of Legends</option>
              <option value="wow">World of Warcraft</option>
              <option value="amongus">Among Us</option>
              <option value="stardew">Stardew Valley</option>
              <option value="hollowknight">Hollow Knight</option>
              <option value="animalcrossing">Animal Crossing: New Horizons</option>
              <option value="sims">The Sims 4</option>
              <option value="gta">Grand Theft Auto V</option>
              <option value="eldenring">Elden Ring</option>
              <option value="overwatch">Overwatch 2</option>
              <option value="hades">Hades</option>
              <option value="fifa">FIFA 23</option>
              <option value="mariokart">Mario Kart 8 Deluxe</option>
              <option value="residentevil">Resident Evil 4</option>
              <option value="tetris">Tetris</option>
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">방송 제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none"
            placeholder="방송 제목 입력"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">방송 내용</label>
          <textarea
            value={contents}
            onChange={(e) => setContents(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none"
            placeholder="방송 내용을 작성해주세요"
            rows={4}
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg transition duration-200"
        >
          스트리밍 시작
        </button>
      </form>
    </div>
  );
};

export default AddStreamKey;