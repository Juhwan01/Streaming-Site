import requests
import base64
import time
import os
import uuid
from dotenv import load_dotenv

load_dotenv()

GITHUB_TOKEN = os.getenv('GITHUB_TOKEN')
GITHUB_API_URL = "https://api.github.com"
REPO_OWNER = os.getenv('GITHUB_USERNAME')
REPO_NAME = "react-code-runner"

headers = {
    "Authorization": f"token {GITHUB_TOKEN}",
    "Accept": "application/vnd.github.v3+json"
}

def create_client_directory(client_id):
    """클라이언트별 고유 디렉토리 생성"""
    return f"clients/{client_id}"

def save_code_to_github(code_content, client_id):
    """GitHub에 React 코드를 저장"""
    file_path = f"{create_client_directory(client_id)}/App.js"
    url = f"{GITHUB_API_URL}/repos/{REPO_OWNER}/{REPO_NAME}/contents/{file_path}"
    data = {
        "message": f"Update React code for client {client_id}",
        "content": base64.b64encode(code_content.encode()).decode(),
    }
    response = requests.put(url, json=data, headers=headers)
    if response.status_code not in [200, 201]:
        raise Exception(f"Failed to save code: {response.json()}")
    return response.json()

def check_workflow_status(run_id):
    """워크플로우 상태 확인"""
    url = f"{GITHUB_API_URL}/repos/{REPO_OWNER}/{REPO_NAME}/actions/runs/{run_id}"
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        raise Exception(f"Failed to check workflow status: {response.json()}")
    return response.json()

def process_react_code(code_content, client_id):
    """React 코드 처리 및 실행"""
    save_result = save_code_to_github(code_content, client_id)
    
    time.sleep(10)  # GitHub Actions 시작 대기
    
    runs_url = f"{GITHUB_API_URL}/repos/{REPO_OWNER}/{REPO_NAME}/actions/runs"
    runs_response = requests.get(runs_url, headers=headers)
    if runs_response.status_code != 200:
        raise Exception(f"Failed to get workflow runs: {runs_response.json()}")
    latest_run = runs_response.json()["workflow_runs"][0]
    
    max_wait_time = 300
    start_time = time.time()
    while True:
        status = check_workflow_status(latest_run["id"])
        if status["status"] == "completed":
            break
        if time.time() - start_time > max_wait_time:
            raise Exception("Workflow execution timed out")
        time.sleep(5)
    
    return {
        "status": status["conclusion"],
        "details_url": latest_run["html_url"],
        "client_id": client_id
    }

def run_client_code(code_content):
    """클라이언트 코드 실행을 위한 인터페이스"""
    client_id = str(uuid.uuid4())  # 고유 클라이언트 ID 생성
    try:
        result = process_react_code(code_content, client_id)
        return {"success": True, "result": result}
    except Exception as e:
        return {"success": False, "error": str(e)}

# 사용 예시
if __name__ == "__main__":
    test_code = """
    import React from 'react';
    
    function App() {
      return (
        <div>
          <h1>Hello, Client's React App!</h1>
        </div>
      );
    }
    
    export default App;
    """
    
    result = run_client_code(test_code)
    print(result)