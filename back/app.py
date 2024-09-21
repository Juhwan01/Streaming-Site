from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import os
import json

app = FastAPI()

class RoomCreateRequest(BaseModel):
    name: str

class ChatMessage(BaseModel):
    type: str
    username: str
    message: str = None

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

rooms = {}

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
        
        for category in result:
            print(f"Category: {category['label']}, Score: {category['score']}")
        
        bad_content = next((item for item in result if item['label'] == '악플/욕설'), None)
        
        if bad_content and bad_content['score'] > 0.4:
            return '악플/욕설', bad_content['score']
        else:
            return 'clean', 0.0
    except Exception as e:
        print(f"Error in content check: {str(e)}")
        return None, None

@app.websocket("/ws/{room_name}")
async def websocket_endpoint(websocket: WebSocket, room_name: str):
    await websocket.accept()
    if room_name not in rooms:
        rooms[room_name] = []
    rooms[room_name].append(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            chat_message = ChatMessage(**data)
            
            if chat_message.type == 'join':
                join_message = f"{chat_message.username} has joined the room."
                await broadcast(room_name, {"type": "system", "message": join_message})
            elif chat_message.type == 'message':
                category, score = await check_content(chat_message.message)
                
                print(f"Original message: {chat_message.message}")
                print(f"Content check result: category={category}, score={score}")

                data["filter_result"] = {
                    "category": category,
                    "score": score
                }

                await broadcast(room_name, data)
    except WebSocketDisconnect:
        rooms[room_name].remove(websocket)
        if not rooms[room_name]:
            del rooms[room_name]

async def broadcast(room_name: str, message: dict):
    for connection in rooms[room_name]:
        await connection.send_json(message)

@app.get("/get_rooms")
async def get_rooms():
    return list(rooms.keys())

@app.post("/create_room")
async def create_room(payload: RoomCreateRequest):
    if payload.name not in rooms:
        rooms[payload.name] = []
        return {"success": True, "message": f"Room '{payload.name}' created successfully"}
    else:
        return {"success": False, "message": f"Room '{payload.name}' already exists"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)