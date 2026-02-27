import asyncio
import argparse
import re
import os
import sys
from datetime import datetime
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup, NavigableString, Tag

class YouAgentCatcher:
    def __init__(self, url, output_dir="./agent_data"):
        self.url = url
        self.output_dir = output_dir
        self.metadata = {
            "url": url,
            "title": "",
            "description": "",
            "crawled_at": datetime.now().isoformat(),
            "pricing_detected": False
        }

    async def fetch_page(self):
        """使用 Playwright 加载动态页面，处理滚动和延迟加载"""
        print(f"[*] YOUAGENT_CATCHER: Initiating link... {self.url}")
        
        async with async_playwright() as p:
            # 模拟现代浏览器环境
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                viewport={'width': 1920, 'height': 1080}
            )
            page = await context.new_page()

            try:
                # [FIX] 策略优化：
                # 1. 使用 domcontentloaded 而非 networkidle，避免因后台长连接导致的超时
                # 2. 增加 try-catch 捕获导航超时，即使超时也尝试继续解析已加载的内容
                print("[*] Navigating (Waiting for DOM)...")
                try:
                    await page.goto(self.url, wait_until="domcontentloaded", timeout=30000)
                except Exception as e:
                    print(f"[!] Warning: Navigation timeout (Background network active). Proceeding with partial load...")

                # 获取页面标题
                try:
                    self.metadata["title"] = await page.title()
                except:
                    self.metadata["title"] = "Unknown Agent"
                
                # [FIX] 强制等待：给予 JS 框架 (React/Next.js) 足够的时间进行 Hydration 和渲染
                print("[*] Hydrating Application (Waiting 5s)...")
                await page.wait_for_timeout(5000)

                # 模拟滚动以触发 Lazy Load
                print("[*] Scrolling to trigger lazy assets...")
                for _ in range(5):
                    await page.mouse.wheel(0, 1000)
                    # 每次滚动后稍作等待，确保内容加载
                    await page.wait_for_timeout(1000)
                
                # 获取最终渲染的 HTML
                content = await page.content()
                print("[*] Payload received. Closing connection.")
                return content
                
            except Exception as e:
                print(f"[!] Critical Error fetching page: {e}")
                return None
            finally:
                await browser.close()

    def clean_soup(self, soup):
        """外科手术式清洗 DOM 树"""
        # 移除无关标签
        for element in soup(['script', 'style', 'noscript', 'iframe', 'svg', 'button', 'input', 'form']):
            element.decompose()
            
        # 移除常见的干扰元素 (Header, Footer, Nav, Ads, Cookies)
        noise_selectors = [
            'header', 'footer', 'nav', 'aside',
            '.nav', '.navbar', '.footer', '.header', 
            '.cookie', '.consent', '.popup', '.modal', 
            '.ad', '.advertisement', '.social-share',
            '#header', '#footer', '#nav'
        ]
        
        for selector in noise_selectors:
            for element in soup.select(selector):
                element.decompose()
                
        return soup

    def extract_metadata(self, soup):
        """提取 Meta 标签信息"""
        desc = soup.find("meta", attrs={"name": "description"})
        if desc:
            self.metadata["description"] = desc.get("content", "").strip()
        
        # 简单的定价检测启发式算法
        pricing_keywords = ["pricing", "plan", "subscribe", "/mo", "/year", "free tier"]
        text_content = soup.get_text().lower()
        if any(kw in text_content for kw in pricing_keywords):
            self.metadata["pricing_detected"] = True

    def html_to_markdown(self, element):
        """将清洗后的 HTML 转换为结构化 Markdown"""
        markdown = ""
        
        if not element:
            return ""

        for child in element.children:
            if isinstance(child, NavigableString):
                text = child.strip()
                if text:
                    markdown += f"{text} "
                continue
            
            if isinstance(child, Tag):
                # 标题处理
                if child.name in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
                    level = int(child.name[1])
                    text = child.get_text().strip()
                    if text:
                        markdown += f"\n\n{'#' * level} {text}\n\n"
                
                # 段落处理
                elif child.name == 'p':
                    text = child.get_text().strip()
                    if text:
                        markdown += f"{text}\n\n"
                
                # 列表处理
                elif child.name == 'ul':
                    for li in child.find_all('li', recursive=False):
                        text = li.get_text().strip()
                        if text:
                            markdown += f"- {text}\n"
                    markdown += "\n"
                elif child.name == 'ol':
                    for i, li in enumerate(child.find_all('li', recursive=False)):
                        text = li.get_text().strip()
                        if text:
                            markdown += f"{i+1}. {text}\n"
                    markdown += "\n"
                
                # 强调处理
                elif child.name in ['strong', 'b']:
                    text = child.get_text().strip()
                    if text:
                        markdown += f"**{text}** "
                
                # 链接处理 (保留重要链接)
                elif child.name == 'a':
                    text = child.get_text().strip()
                    href = child.get('href', '')
                    if text and href and not href.startswith('#') and not href.startswith('javascript'):
                        markdown += f"[{text}]({href}) "
                
                # 递归处理 div, main, article, section
                elif child.name in ['div', 'main', 'article', 'section', 'span']:
                    markdown += self.html_to_markdown(child)
        
        return markdown

    def process(self):
        # 1. 抓取
        html = asyncio.run(self.fetch_page())
        if not html:
            return

        # 2. 解析
        soup = BeautifulSoup(html, 'html.parser')
        
        # 3. 提取元数据
        self.extract_metadata(soup)
        
        # 4. 清洗
        soup = self.clean_soup(soup)
        
        # 5. 提取主要内容
        # 优先查找 <main> 或 <article>，否则使用 <body>
        main_content = soup.find('main') or soup.find('article') or soup.find('body')
        
        # 6. 转换为 Markdown
        markdown_text = self.html_to_markdown(main_content)
        
        # 7. 格式化输出
        final_report = self.generate_report(markdown_text)
        self.save_to_file(final_report)

    def generate_report(self, content):
        """生成符合 YOUAGENT 数据库标准的头部格式"""
        safe_id = re.sub(r'[^a-z0-9]', '', (self.metadata['title'] or 'unknown').lower()[:10])
        return f"""---
YOUAGENT_ID: {safe_id}_{datetime.now().strftime('%Y%m%d')}
TITLE: {self.metadata['title']}
URL: {self.metadata['url']}
DESCRIPTION: {self.metadata['description']}
PRICING_TAGS: {self.metadata['pricing_detected']}
CRAWLED_AT: {self.metadata['crawled_at']}
---

# MAIN CONTENT

{content}
"""

    def save_to_file(self, content):
        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)
            
        # 生成安全的文件名
        safe_title = re.sub(r'[\\/*?:"<>|]', "", self.metadata['title'] or "unknown_agent")
        safe_title = safe_title.replace(" ", "_").lower()
        if not safe_title:
            safe_title = "agent_data"
            
        filename = f"{self.output_dir}/{safe_title}.md"
        
        with open(filename, "w", encoding="utf-8") as f:
            f.write(content)
        
        print(f"[+] SUCCESS: Neural patterns saved to -> {filename}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='YouAgent Catcher // AI Agent Knowledge Harvester')
    parser.add_argument('--url', type=str, required=True, help='Target URL of the AI Agent')
    args = parser.parse_args()

    catcher = YouAgentCatcher(url=args.url)
    catcher.process()
