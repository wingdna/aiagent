import requests
import os
import time
import re
from datetime import datetime

class MassHarvester:
    def __init__(self, seed_file="seeds.txt", output_dir="./raw_intelligence", error_log="error_log.txt"):
        self.seed_file = seed_file
        self.output_dir = output_dir
        self.error_log = error_log
        self.headers = {
            "User-Agent": "YOUAGENT_HARVESTER/1.0 (Compatible; ResearchBot)"
        }

    def setup_environment(self):
        """Initialize directories and verify inputs."""
        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)
            print(f"[*] Directory initialized: {self.output_dir}")
        
        if not os.path.exists(self.seed_file):
            print(f"[!] CRITICAL: {self.seed_file} not found. Run seed_hunter.py first.")
            return False
        return True

    def slugify_url(self, url):
        """Convert URL to a filesystem-safe filename."""
        # Remove http/https
        safe_name = re.sub(r'^https?://', '', url)
        # Replace non-alphanumeric chars with underscore
        safe_name = re.sub(r'[^a-zA-Z0-9]', '_', safe_name)
        # Limit length to avoid OS errors
        return safe_name[:200]

    def log_error(self, url, error_msg):
        """Append anomalies to the error log."""
        timestamp = datetime.now().isoformat()
        with open(self.error_log, "a", encoding="utf-8") as f:
            f.write(f"[{timestamp}] FAIL: {url} | REASON: {error_msg}\n")

    def engage(self):
        if not self.setup_environment():
            return

        with open(self.seed_file, "r", encoding="utf-8") as f:
            urls = [line.strip() for line in f if line.strip()]

        total_targets = len(urls)
        print(f"___ YOUAGENT MASS HARVESTER ONLINE ___")
        print(f"[*] TARGETS ACQUIRED: {total_targets}")
        print(f"[*] PROTOCOL: Jina Reader (Markdown)")
        print(f"[*] THROTTLE: 2.0s delay")
        print("---------------------------------------")

        success_count = 0
        
        for index, target_url in enumerate(urls):
            # Progress indicator
            progress = f"[{index+1}/{total_targets}]"
            
            # Check if already harvested to allow resume capability
            filename = self.slugify_url(target_url) + ".txt"
            filepath = os.path.join(self.output_dir, filename)
            
            if os.path.exists(filepath):
                print(f"{progress} [SKIP] Already archived: {target_url}")
                continue

            try:
                # Jina Reader Interface
                jina_endpoint = f"https://r.jina.ai/{target_url}"
                
                print(f"{progress} [>>>] Extracting: {target_url}...", end="\r")
                
                response = requests.get(jina_endpoint, headers=self.headers, timeout=20)
                
                if response.status_code == 200:
                    content = response.text
                    
                    # Basic validation: If content is too short, it might be a failed read
                    if len(content) < 50:
                        raise Exception("Content too short/Empty response")

                    # Add metadata header
                    meta_header = f"---\nSOURCE: {target_url}\nFETCHED: {datetime.now().isoformat()}\n---\n\n"
                    
                    with open(filepath, "w", encoding="utf-8") as f:
                        f.write(meta_header + content)
                    
                    print(f"{progress} [OK]  Archived ({len(content)} bytes)")
                    success_count += 1
                else:
                    error_msg = f"HTTP {response.status_code}"
                    print(f"{progress} [ERR] {error_msg}")
                    self.log_error(target_url, error_msg)

            except Exception as e:
                print(f"{progress} [ERR] Connection Failed")
                self.log_error(target_url, str(e))

            # Rate Limiting (Crucial for Jina and target servers)
            time.sleep(2)

        print("---------------------------------------")
        print(f"[*] HARVEST COMPLETE.")
        print(f"[*] SUCCESS RATE: {success_count}/{total_targets}")
        print(f"[*] INTELLIGENCE STORED IN: {self.output_dir}")

if __name__ == "__main__":
    harvester = MassHarvester()
    harvester.engage()
