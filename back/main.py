from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.middleware.cors import CORSMiddleware
from fastapi import WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from Module.chat import *
from dependencies.database import get_db, init_db
from dependencies.config import get_config
from domains.users.models import User
from domains.users.dto import *
from domains.users.services import UserService
from dependencies.auth import AuthService
from fastapi import BackgroundTasks
from fastapi.concurrency import run_in_threadpool
from Levenshtein import ratio
import httpx, shutil

app = FastAPI()
rooms = {}
broadcast_info = {}

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

config = get_config()
init_db(config)
app.mount("/img", StaticFiles(directory="img"), name="img")

@app.post("/signup", response_model=UserProfileDTO)
async def signup(user_data: UserSignUpDTO, db: AsyncSession = Depends(get_db)):
    user_service = UserService(db)
    return await user_service.create_user(user_data)

@app.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    try:
        file_location = f"./img/{file.filename}"
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return {"image_url": f"http://3.36.103.8:8000/img/{file.filename}"}
    except Exception as e:
        return JSONResponse(content={"message": f"Error: {str(e)}"}, status_code=400)

@app.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    user_service = UserService(db)
    try:
        user = await user_service.authenticate_user(form_data.username, form_data.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        access_token = await AuthService.create_access_token(data={"sub": user.username})
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        print(f"Login error: {str(e)}")  # 디버깅을 위한 로그
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during login",
        )

@app.get("/users/me", response_model=UserWithAccountDTO)
async def read_users_me(
    current_user: User = Depends(AuthService.get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    user_service = UserService(db)
    return await user_service.get_user_profile(current_user)

@app.put("/users/me", response_model=UserProfileDTO)
async def update_user_me(
    user_update: UserProfileDTO,
    current_user: User = Depends(AuthService.get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    user_service = UserService(db)
    updated_user = await user_service.update_user_profile(current_user.id, user_update)
    return updated_user


@app.post("/charge", response_model=TopUpResponseDTO)
async def charge_account(
    charge_data: TopUpDTO,
    current_user: User = Depends(AuthService.get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    user_service = UserService(db)
    return await user_service.top_up_account(current_user.id, charge_data)

@app.post("/withdraw", response_model=TopUpResponseDTO)
async def withdraw_account(
    withdraw_data: TopUpDTO,
    current_user: User = Depends(AuthService.get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    user_service = UserService(db)
    return await user_service.withdraw_account(current_user.id, withdraw_data)

@app.get("/protected")
async def protected_route(current_user: User = Depends(AuthService.get_current_active_user)):
    return {"message": "This is a protected route", "user": current_user.username}

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
                await broadcast(room_name, {"type": "system", "message": join_message}, rooms)
            elif chat_message.type == 'message':
                category, score = await check_content(chat_message.message)
                
                print(f"Original message: {chat_message.message}")
                print(f"Content check result: category={category}, score={score}")

                data["filter_result"] = {
                    "category": category,
                    "score": score
                }

                await broadcast(room_name, data,rooms)
    except WebSocketDisconnect:
        rooms[room_name].remove(websocket)
        if not rooms[room_name]:
            del rooms[room_name]

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

@app.get("/streams")
async def get_streams():
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get("http://3.36.103.8:3001/streams")
            room_dt = response.json()
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
    print(broadcast_info)
    print(room_dt)
    for key in broadcast_info.keys():
       if broadcast_info[key]['broadcast_data'] == []:
           for stream in room_dt.get('activeStreams', []):
                room_key = stream.get('streamKey')
                if room_key in broadcast_info:
                    broadcast_info[room_key].setdefault('broadcast_data', []).append({
                        'status': stream.get('status'),
                        'startTime': stream.get('startTime')
                    })
                    broadcast_info[room_key]['startTime'] = stream.get('startTime')
    return broadcast_info
    
@app.post("/add_stream_key", status_code=status.HTTP_201_CREATED)
async def add_stream_key(_payload: StreamKeyDTO, db: AsyncSession = Depends(get_db)
                         , current_user: User = Depends(AuthService.get_current_active_user)):
    url = "http://13.209.42.36:3001/stream-key"
    print(1)
    payload = {"streamKey": _payload.streamKey}
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=500,
            detail=f"스트리밍 키 추가 요청 중 오류가 발생했습니다: {str(e)}"
        )
    us = UserService(db)
    user:User = await us.get_user_profile(current_user)
    broadcast_info[_payload.streamKey] = {
        "nickname":user.username,
        "tag": _payload.tags,
        "title": _payload.title,
        "content": _payload.contents,
        "profile_pic": user.profile_picture,
        "startTime": None,
        "watchnum": 0,
        "broadcast_data":[]
    }
    rooms[_payload.streamKey] = []
    print(broadcast_info)
    return broadcast_info

# main.py - 새로운 엔드포인트 추가
@app.post("/stream_ended")
async def stream_ended(stream_data: dict):
    stream_key = stream_data.get('streamKey')
    if stream_key and stream_key in broadcast_info:
        del broadcast_info[stream_key]
        return {"success": True, "message": f"Stream {stream_key} removed from broadcast_info"}
    return {"success": False, "message": "Stream key not found"}

@app.get("/search")
async def getBroadCastInfo(query:str):
    for stream_key, stream_data in broadcast_info.items():
        querysim = []
        keysiface = []
        querysim.append(ratio(stream_data['nickname'], query))
        querysim.append(ratio(stream_data['title'], query))
        for tag in stream_data['tag']:
            querysim.append(ratio(tag, query))
        for sim in querysim:
            if sim >= 0.6:
                keysiface.append(broadcast_info[stream_key])
        return keysiface
        

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
