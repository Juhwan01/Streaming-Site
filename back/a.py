from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import shutil
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS 설정 추가
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 모든 도메인에서 요청 허용
    allow_credentials=True,
    allow_methods=["*"],  # 모든 HTTP 메서드 허용
    allow_headers=["*"],  # 모든 헤더 허용
)

# 이미지 파일을 제공할 static 폴더 경로 설정
app.mount("/img", StaticFiles(directory="img"), name="img")

@app.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    try:
        # 업로드된 파일 저장 경로 설정
        file_location = f"./img/{file.filename}"
        
        # 파일 저장 로직
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # 클라이언트가 접근할 수 있는 URL 반환
        return {"image_url": f"http://localhost:8000/img/{file.filename}"}
    
    except Exception as e:
        return JSONResponse(content={"message": f"Error: {str(e)}"}, status_code=400)

import uvicorn
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)