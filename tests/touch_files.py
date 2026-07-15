import os

def touch_code_files():
    root_dir = "c:\\Users\\magar\\OneDrive\\Desktop\\GenAI-enabled Smart Stadiums & Tournament Operations"
    extensions = {
        ".py": "\n# Build Sync: July 15, 2026\n",
        ".tsx": "\n// Build Sync: July 15, 2026\n",
        ".ts": "\n// Build Sync: July 15, 2026\n",
        ".css": "\n/* Build Sync: July 15, 2026 */\n"
    }

    print("Touching code files to refresh timestamps...")
    for dirpath, _, filenames in os.walk(root_dir):
        # Ignore package folders and git caches
        if "node_modules" in dirpath or ".git" in dirpath or "__pycache__" in dirpath or ".pytest_cache" in dirpath:
            continue
            
        for filename in filenames:
            _, ext = os.path.splitext(filename)
            if ext in extensions:
                file_path = os.path.join(dirpath, filename)
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        content = f.read()
                    
                    # Check if already touched to avoid double appends
                    marker = "Build Sync: July 15"
                    if marker not in content:
                        with open(file_path, "a", encoding="utf-8") as f:
                            f.write(extensions[ext])
                        print(f"Touched: {filename}")
                except Exception as e:
                    print(f"Skipped {filename} due to error: {e}")

if __name__ == "__main__":
    touch_code_files()
