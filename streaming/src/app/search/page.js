"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import Header from "@/components/Header";

// ResultItem 컴포넌트
const ResultItem = ({ result }) => (
  <li
    style={{
      display: "flex",
      marginBottom: "25px",
      borderRadius: "16px",
      background: "linear-gradient(135deg, #1f1f1f, #2e2e2e)",
      boxShadow: "0 8px 16px rgba(0, 0, 0, 0.1)",
      padding: "20px",
      transition: "transform 0.3s ease, box-shadow 0.3s ease",
      overflow: "hidden",
      cursor: "pointer",
    }}
    onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.025)")}
    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
  >
    <img
      src={result.thumbnail || "/placeholder-image.jpg"}
      alt={result.title || "제목 없음"}
      style={{
        width: "160px",
        height: "110px",
        marginRight: "20px",
        borderRadius: "12px",
        objectFit: "cover",
        transition: "all 0.3s ease",
      }}
    />
    <div style={{ flex: 1 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "15px",
        }}
      >
        {result.live ? (
          <span
            style={{
              backgroundColor: "#ff4c4c",
              color: "white",
              padding: "8px 14px",
              borderRadius: "20px",
              fontSize: "14px",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
            }}
          >
            LIVE
          </span>
        ) : (
          <span
            style={{
              backgroundColor: "#6c757d",
              color: "white",
              padding: "8px 14px",
              borderRadius: "20px",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
            }}
          >
            VOD
          </span>
        )}
      </div>
      <h2
        style={{
          fontSize: "24px",
          fontWeight: "bold",
          color: "#fff",
          marginBottom: "10px",
          textTransform: "capitalize",
          lineHeight: "1.4",
          transition: "color 0.3s ease",
        }}
      >
        {result.title || "제목 없음"}
      </h2>
      <p
        style={{
          fontSize: "16px",
          color: "#aaa",
          marginBottom: "10px",
          fontStyle: "italic",
        }}
      >
        {result.game || "게임 정보 없음"}
      </p>
      <p
        style={{
          fontSize: "16px",
          color: "#ddd",
          marginBottom: "10px",
        }}
      >
        시청자 {result.viewers || 0}명
      </p>
      <p
        style={{
          fontSize: "14px",
          color: "#bbb",
          marginBottom: "15px",
          lineHeight: "1.5",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          overflow: "hidden",
        }}
      >
        {result.description || "설명 없음"}
      </p>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        {(result.tags || []).map((tag, idx) => (
          <span
            key={idx}
            style={{
              backgroundColor: "#444",
              color: "#fff",
              padding: "8px 14px",
              borderRadius: "18px",
              fontSize: "14px",
              fontWeight: "bold",
              transition: "background-color 0.3s ease",
              cursor: "pointer",
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  </li>
);

// SearchResults 컴포넌트
function SearchResults() {
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const searchParams = useSearchParams();
  const query = searchParams.get("query");

  const fetchResults = async (searchQuery) => {
    if (!searchQuery) return;

    console.log("Searching for:", searchQuery);
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get("http://3.36.103.8:8001/search", {
        params: { query: searchQuery },
      });

      console.log("Search response:", response.data);

      if (response && response.data) {
        setResults(Array.isArray(response.data) ? response.data : []);
      } else {
        console.log("Empty response or data");
        setResults([]);
      }
    } catch (error) {
      console.error("검색 에러:", error);
      setError("검색 중 오류가 발생했습니다.");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResults(query);
  }, [query]);

  return (
    <div>
      <h1
        style={{
          fontSize: "42px",
          fontWeight: "bold",
          color: "#fff",
          textAlign: "center",
          marginBottom: "40px",
          textTransform: "uppercase",
          letterSpacing: "2px",
        }}
      >
        {query ? `'${query}' 검색 결과` : "검색 결과"}
      </h1>

      {isLoading && (
        <p
          style={{
            fontSize: "18px",
            color: "#ddd",
            textAlign: "center",
            marginTop: "40px",
          }}
        >
          검색 중...
        </p>
      )}

      {error && (
        <p
          style={{
            fontSize: "18px",
            color: "#ff4c4c",
            textAlign: "center",
            marginTop: "40px",
          }}
        >
          {error}
        </p>
      )}

      <div>
        {!isLoading &&
          results &&
          (results.length > 0 ? (
            <ul style={{ listStyle: "none", padding: "0" }}>
              {results.map((result, index) => (
                <ResultItem key={index} result={result} />
              ))}
            </ul>
          ) : (
            <p
              style={{
                fontSize: "18px",
                color: "#ddd",
                textAlign: "center",
                marginTop: "40px",
              }}
            >
              검색 결과가 없습니다.
            </p>
          ))}
      </div>
    </div>
  );
}

// Loading 컴포넌트
function LoadingFallback() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "50vh",
      }}
    >
      <p
        style={{
          fontSize: "18px",
          color: "#ddd",
          textAlign: "center",
        }}
      >
        페이지 로딩 중...
      </p>
    </div>
  );
}

// 메인 SearchPage 컴포넌트
export default function SearchPage() {
  return (
    <>
      <Header />
      <div
        style={{
          padding: "40px",
          background: "linear-gradient(135deg, #000000, #333333)",
          minHeight: "100vh",
        }}
      >
        <Suspense fallback={<LoadingFallback />}>
          <SearchResults />
        </Suspense>
      </div>
    </>
  );
}