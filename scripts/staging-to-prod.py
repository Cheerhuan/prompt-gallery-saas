import json
import os
import shutil
import sys
import subprocess
from datetime import datetime

PROMPTS_PATH = "src/data/prompts.json"
STAGING_PATH = "src/data/staging/pending_prompts.json"
BACKUP_DIR = "src/data/backups"

def backup_prompts():
    os.makedirs(BACKUP_DIR, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = f"{BACKUP_DIR}/prompts.json.bak_{timestamp}"
    shutil.copy2(PROMPTS_PATH, backup_path)
    print(f"Backup created: {backup_path}")
    return backup_path

def safe_load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
        # Clean control characters to prevent JSONDecodeError
        import re
        content = re.sub(r'[\x00-\x1F\x7F]', ' ', content)
        return json.loads(content)

def main():
    try:
        # 1. Load data
        if not os.path.exists(STAGING_PATH):
            print("No staging file found.")
            sys.exit(0)
            
        pending = safe_load_json(STAGING_PATH)
        if not pending:
            print("Staging area is empty.")
            sys.exit(0)
            
        prompts = safe_load_json(PROMPTS_PATH)
        
        # 2. Backup
        backup_path = backup_prompts()
        
        # 3. ID Management
        # Filter only numeric IDs to find max, avoid ValueError with descriptive IDs
        numeric_ids = []
        for p in prompts:
            try:
                numeric_ids.append(int(p['id']))
            except (ValueError, KeyError):
                continue
        
        current_max = max(numeric_ids) if numeric_ids else 0
        
        # 4. Atomic Append
        for i, item in enumerate(pending):
            # Ensure ID is a string and incremented
            item['id'] = str(current_max + i + 1)
            prompts.append(item)
            
        # 5. Write and Verify
        with open(PROMPTS_PATH, 'w', encoding='utf-8') as f:
            json.dump(prompts, f, indent=2, ensure_ascii=False)
            
        # Verification
        verify_data = safe_load_json(PROMPTS_PATH)
        if len(verify_data) < len(prompts):
            raise Exception("Data loss detected during write!")
            
        # 6. Clear Staging
        with open(STAGING_PATH, 'w', encoding='utf-8') as f:
            json.dump([], f, indent=2)
            
        # 7. Log Delivery
        log_path = "src/data/staging/delivery_log.json"
        try:
            with open(log_path, 'r', encoding='utf-8') as f:
                logs = json.load(f)
        except:
            logs = []
            
        logs.append({
            "timestamp": datetime.now().isoformat(),
            "count": len(pending),
            "ids": [p['id'] for p in prompts[-len(pending):]],
            "status": "success"
        })
        with open(log_path, 'w', encoding='utf-8') as f:
            json.dump(logs, f, indent=2, ensure_ascii=False)
            
        print(f"Successfully migrated {len(pending)} items to production.")
        print(f"New total count: {len(verify_data)}")
        
    except Exception as e:
        print(f"CRITICAL ERROR: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
