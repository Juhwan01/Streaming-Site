import requests
import json
import os

# Hugging Face API Token (실제 토큰으로 교체해야 합니다)
API_TOKEN = os.getenv("HUGGINGFACEHUB_API_TOKEN")

# API 엔드포인트 URL
API_URL = "https://api-inference.huggingface.co/models/smilegate-ai/kor_unsmile"

# 헤더 설정
headers = {
    "Authorization": f"Bearer {API_TOKEN}",
    "Content-Type": "application/json"
}

# 테스트할 텍스트 목록
test_texts = [
    "씨!!!!!!!!!!발 진짜",
    "여자들은 운전을 못해.",
    "나이 든 사람들은 기술을 이해 못 해.",
    "외국인들은 우리나라에서 살면 안 돼."
]

# 결과를 저장할 리스트
results = []

# 각 텍스트에 대해 API 요청 보내기
for text in test_texts:
    payload = {"inputs": text}
    
    response = requests.post(API_URL, headers=headers, json=payload)
    
    if response.status_code == 200:
        result = response.json()[0]
        
        # 가장 높은 확률을 가진 카테고리 찾기
        max_category = max(result, key=lambda x: x['score'])
        
        results.append({
            "text": text,
            "category": max_category['label'],
            "probability": max_category['score']
        })
    else:
        results.append({
            "text": text,
            "error": f"API request failed with status code {response.status_code}"
        })

# 결과 출력
for result in results:
    print(json.dumps(result, ensure_ascii=False, indent=2))