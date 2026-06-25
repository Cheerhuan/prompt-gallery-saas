import json
import os

root = "/Users/xiebinghuan/prompt-gallery-saas" # Correcting project path if it was truncated
# Re-checking actual path from user prompt: /Users/xiebinghuan/prompt-gallery-saas
root = "/Users/xiebinghuan/prompt-gallery-saas"
main_path = os.path.join(root, "src/data/prompts.json")
tmp_path = os.path.join(root, "src/data/prompts.json.tmp")

try:
    with open(main_path, 'r', encoding='utf-8') as f:
        raw_data = f.read().strip()
        # Try to find the last ']' in case there is trailing garbage
        last_bracket = raw_data.rfind(']')
        if last_bracket != -1:
            json_content = raw_data[:last_bracket+1]
        else:
            json_content = raw_data
        data = json.loads(json_content)
    
    with open(tmp_path, 'r', encoding='utf-8') as f:
        new_items = json.load(f)
    
    data.extend(new_items)
    
    with open(main_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"Successfully merged {len(new_items)} items")
    if os.path.exists(tmp_path):
        os.remove(tmp_path)
except Exception as e:
    print(f"Error: {e}")
    exit(1)
