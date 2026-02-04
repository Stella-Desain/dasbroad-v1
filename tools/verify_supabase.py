import os
import sys
import requests
import json

# Load .env manually since python-dotenv might not be installed
def load_env():
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                if line.strip() and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    # Remove quotes if present
                    if value.startswith('"') and value.endswith('"'):
                        value = value[1:-1]
                    os.environ[key] = value

def check_supabase():
    url = os.environ.get("VITE_SUPABASE_URL")
    key = os.environ.get("VITE_SUPABASE_PUBLISHABLE_KEY")

    if not url or not key:
        print("❌ Error: Supabase credentials missing in .env")
        return

    print(f"Checking Supabase connection to: {url}")
    
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}"
    }

    try:
        # Try to fetch from a standard table or just checking health if possible
        # We know 'gcal_events_cache' exists from schema
        response = requests.get(f"{url}/rest/v1/gcal_events_cache?select=count", headers=headers)
        
        if response.status_code == 200:
             print("✅ Supabase Connection: SUCCESS")
             print(f"Response: {response.text}")
        else:
            print(f"❌ Supabase Connection: FAILED (Status: {response.status_code})")
            print(f"Response: {response.text}")

    except Exception as e:
        print(f"❌ Supabase Connection: ERROR ({str(e)})")

if __name__ == "__main__":
    load_env()
    check_supabase()
