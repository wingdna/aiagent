import os
import time
import json
import logging
import random
from google import genai
from google.genai import types

# 尝试加载 .env 文件
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

logging.basicConfig(level=logging.INFO, format='[%(asctime)s] YOUAGENT_ALCHEMY: %(message)s')

class AlchemyFactory:
    def __init__(self, seed_file="seeds.txt", output_file="data/agents_db.json"):
        self.seed_file = seed_file
        self.output_file = output_file
        
        # 确保输出目录存在
        os.makedirs(os.path.dirname(self.output_file), exist_ok=True)
        
        # 初始化 API
        api_key = os.environ.get("API_KEY")
        if not api_key:
             api_key = input("ENTER API KEY: ").strip()
        
        self.client = genai.Client(api_key=api_key)
        self.active_model = self._brute_force_connect()

        # V2.1 协议 Schema
        self.agent_schema = {
            "type": types.Type.OBJECT,
            "properties": {
                "id": {"type": types.Type.STRING},
                "name": {"type": types.Type.STRING},
                "slogan": {"type": types.Type.STRING},
                "description": {"type": types.Type.STRING},
                "metrics": {
                    "type": types.Type.OBJECT,
                    "properties": {
                        "reasoning": {"type": types.Type.INTEGER},
                        "creativity": {"type": types.Type.INTEGER},
                        "speed": {"type": types.Type.INTEGER}
                    },
                    "required": ["reasoning", "creativity", "speed"]
                },
                "stats": {
                    "type": types.Type.OBJECT,
                    "properties": {
                        "wins": {"type": types.Type.INTEGER},
                        "losses": {"type": types.Type.INTEGER},
                        "elo": {"type": types.Type.INTEGER}
                    },
                    "required": ["wins", "losses", "elo"]
                },
                "connectivity": {
                    "type": types.Type.OBJECT,
                    "properties": {
                        "try_url": {"type": types.Type.STRING},
                        "iframe_safe": {"type": types.Type.BOOLEAN}
                    },
                    "required": ["try_url", "iframe_safe"]
                },
                "tags": {
                    "type": types.Type.ARRAY,
                    "items": {"type": types.Type.STRING}
                }
            },
            "required": ["id", "name", "slogan", "description", "metrics", "stats", "connectivity", "tags"]
        }

    def _brute_force_connect(self):
        # 优先尝试支持 Search 的模型
        candidates = ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash']
        for model in candidates:
            try:
                self.client.models.generate_content(
                    model=model, contents="Ping", 
                    config=types.GenerateContentConfig(max_output_tokens=5)
                )
                print(f"[*] CONNECTION SECURED: {model}")
                return model
            except:
                continue
        return 'gemini-1.5-flash' # Fallback

    def process_seeds(self):
        if not os.path.exists(self.seed_file):
            print(f"[!] {self.seed_file} not found. Run seed_hunter.py first.")
            return

        with open(self.seed_file, 'r') as f:
            urls = [line.strip() for line in f if line.strip()]

        logging.info(f"Loaded {len(urls)} targets from seed file.")
        
        agents_db = []
        
        # 视频海报库 (用于前端渲染)
        posters = [
            "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1614726365723-49cfae90ecfc?q=80&w=600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1535016120720-40c6874c3b13?q=80&w=600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?q=80&w=600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop"
        ]

        # 批处理循环
        for i, url in enumerate(urls):
            logging.info(f"[{i+1}/{len(urls)}] Auditing: {url}")
            
            prompt = f"""
            You are the YouAgent Chief Neural Auditor. 
            Target URL: {url}
            
            Task: Use Google Search to analyze this Agent's capabilities, architecture, and performance.
            Alignment: Quantify metrics (0-100) based on 2026 industry standards.
            
            Output strictly valid JSON conforming to the schema.
            """
            
            try:
                # 尝试启用 Google Search
                tools = []
                try:
                    tools = [{'googleSearch': {}}] 
                except:
                    pass

                response = self.client.models.generate_content(
                    model=self.active_model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=self.agent_schema,
                        tools=tools, 
                        temperature=0.2
                    )
                )

                if response.text:
                    data = json.loads(response.text)
                    
                    # --- UI Compatibility Injection ---
                    # 自动注入前端需要的额外字段
                    data['video_poster'] = random.choice(posters)
                    
                    # 从标签推导分类
                    tags = [t.upper() for t in data.get('tags', [])]
                    category = "TEXT_GEN"
                    if any(x in tags for x in ['IMAGE', 'ART', 'DESIGN']): category = "IMAGE_GEN"
                    elif any(x in tags for x in ['VIDEO', 'MOTION', '3D']): category = "VIDEO_GEN"
                    elif any(x in tags for x in ['CODE', 'DEV', 'PYTHON', 'IDE']): category = "CODING"
                    elif any(x in tags for x in ['SECURITY', 'HACKING']): category = "SECURITY"
                    elif any(x in tags for x in ['SEARCH', 'DATA', 'ANALYSIS']): category = "ANALYSIS"
                    data['category'] = category
                    
                    # 确保 stats 默认值
                    if 'stats' not in data: data['stats'] = {"wins": 0, "losses": 0, "elo": 1200}
                    
                    agents_db.append(data)
                    logging.info(f"   -> [OK] {data['name']} (ELO: {data['stats']['elo']})")
                    
                    # 实时保存，防止中断丢失
                    self.save_db(agents_db)
                    
                    # 限流保护
                    time.sleep(2)
                    
            except Exception as e:
                logging.error(f"   -> [FAIL] {url}: {e}")
                continue

    def save_db(self, data):
        with open(self.output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    factory = AlchemyFactory()
    factory.process_seeds()
