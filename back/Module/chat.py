import requests
import os


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



async def broadcast(room_name: str, message: dict, rooms: dict):
    for connection in rooms[room_name]:
        await connection.send_json(message)
