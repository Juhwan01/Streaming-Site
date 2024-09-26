from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.middleware.cors import CORSMiddleware

from dependencies.database import get_db, init_db
from dependencies.config import get_config
from domains.users.models import User
from domains.users.dto import UserSignUpDTO, UserProfileDTO, Token, TopUpDTO, UserWithAccountDTO ,TopUpResponseDTO
from domains.users.services import UserService
from dependencies.auth import AuthService

app = FastAPI()

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
    user = await user_service.authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = await AuthService.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)