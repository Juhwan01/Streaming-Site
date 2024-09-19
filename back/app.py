from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import os
import json

app = FastAPI()

class RoomCreateRequest(BaseModel):
    title: int

class ChatMessage(BaseModel):
    username: str
    message: str

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 필요한 도메인으로 제한하는 것이 보안에 좋습니다.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ws_user = []
ws_group = {}

# Hugging Face API 설정
API_TOKEN = os.getenv("HUGGINGFACEHUB_API_TOKEN")
API_URL = "https://api-inference.huggingface.co/models/smilegate-ai/kor_unsmile"
headers = {
    "Authorization": f"Bearer {API_TOKEN}",
    "Content-Type": "application/json"
}

async def check_content(text):
    try:
        payload = {"inputs": text}
        response = requests.post(API_URL, headers=headers, json=payload)
        response.raise_for_status()
        result = response.json()[0]
        
        # 모든 카테고리와 점수를 로깅
        for category in result:
            print(f"Category: {category['label']}, Score: {category['score']}")
        
        # '악플/욕설' 카테고리 찾기
        bad_content = next((item for item in result if item['label'] == '악플/욕설'), None)
        
        if bad_content and bad_content['score'] > 0.7:  # 임계값 설정 (예: 0.7)
            return '악플/욕설', bad_content['score']
        else:
            return 'clean', 0.0
    except Exception as e:
        print(f"Error in content check: {str(e)}")
        return None, None

async def send_warning(websocket: WebSocket, message: str):
    await websocket.send_json({"type": "warning", "message": message})

@app.websocket("/ws/notice_board")
async def websocket_notice(websocket: WebSocket):
    await websocket.accept()
    ws_user.append(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            chat_message = ChatMessage(**data)
            category, score = await check_content(chat_message.message)
            
            print(f"Original message: {chat_message.message}")  # 백엔드 로깅
            print(f"Content check result: category={category}, score={score}")

            # 필터링 결과를 메시지에 포함
            data["filter_result"] = {
                "category": category,
                "score": score
            }

            for wb in ws_user:
                await wb.send_json(data)
    except WebSocketDisconnect:
        ws_user.remove(websocket)

@app.websocket("/ws/{client_id}")
async def websocket_group(websocket: WebSocket, client_id: int):
    await websocket.accept()
    if client_id not in ws_group:
        ws_group[client_id] = []
    ws_group[client_id].append(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            chat_message = ChatMessage(**data)
            category, score = await check_content(chat_message.message)
            
            print(f"Original message: {chat_message.message}")
            print(f"Content check result: category={category}, score={score}")

            # 필터링 결과를 메시지에 포함
            data["filter_result"] = {
                "category": category,
                "score": score
            }

            for wb in ws_group[client_id]:
                await wb.send_json(data)
    except WebSocketDisconnect:
        ws_group[client_id].remove(websocket)
        if not ws_group[client_id]:
            del ws_group[client_id]

@app.get("/get_group")
async def get_group():
    return list(ws_group.keys())

@app.post("/create_group")
async def create_group(payload: RoomCreateRequest):
    ws_group[payload.title] = []
    return True

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)