import os
import requests

# Load .env manually
def load_env():
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                if line.strip() and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    if value.startswith('"') and value.endswith('"'):
                        value = value[1:-1]
                    os.environ[key] = value

def check_gcal_tokens():
    url = os.environ.get("VITE_SUPABASE_URL")
    key = os.environ.get("VITE_SUPABASE_PUBLISHABLE_KEY")

    if not url or not key:
        print("❌ Error: Supabase credentials missing in .env")
        return

    print(f"Checking Google Calendar Tokens in Supabase...")
    
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}"
    }

    try:
        # Check if table exists and if we can select from it
        response = requests.get(f"{url}/rest/v1/google_oauth_tokens?select=count", headers=headers)
        
        if response.status_code == 200:
             count = response.json()[0]['count']
             print(f"✅ GCal Tokens Table Accessible. Token Count: {count}")
        else:
            print(f"❌ GCal Tokens Table Check FAILED (Status: {response.status_code})")
            print(f"Response: {response.text}")

    except Exception as e:
        print(f"❌ GCal Tokens Check ERROR ({str(e)})")

if __name__ == "__main__":
    load_env()
    check_gcal_tokens()
