from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.middleware.cors import CORSMiddleware
from fastapi import WebSocket, WebSocketDisconnect
from Module.chat import *
from dependencies.database import get_db, init_db
from dependencies.config import get_config
from domains.users.models import User
from domains.users.dto import *
from domains.users.services import UserService
from dependencies.auth import AuthService

app = FastAPI()

rooms = {}

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React 앱의 URL
    allow_credentials=True,
    allow_methods=["*"],  # 모든 HTTP 메서드 허용
    allow_headers=["*"],  # 모든 HTTP 헤더 허용
)

config = get_config()
init_db(config)

@app.post("/signup", response_model=UserProfileDTO)
async def signup(user_data: UserSignUpDTO, db: AsyncSession = Depends(get_db)):
    user_service = UserService(db)
    return await user_service.create_user(user_data)

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

                await broadcast(room_name, data, rooms)
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



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)