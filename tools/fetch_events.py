import os
import requests
import json
from datetime import datetime, timedelta

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

def fetch_gcal_events():
    url = os.environ.get("VITE_SUPABASE_URL")
    key = os.environ.get("VITE_SUPABASE_PUBLISHABLE_KEY")

    if not url or not key:
        print("❌ Error: Supabase credentials missing in .env")
        return

    print(f"Fetching GCal Events from Cache...")
    
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}"
    }

    try:
        # Fetch last 5 events
        response = requests.get(f"{url}/rest/v1/gcal_events_cache?select=*&limit=5&order=created.desc", headers=headers)
        
        if response.status_code == 200:
             events = response.json()
             print(f"✅ Fetched {len(events)} events from cache.")
             for event in events:
                 print(f" - [{event.get('event_id')}] {event.get('summary')} ({event.get('status')})")
        else:
            print(f"❌ Events Fetch FAILED (Status: {response.status_code})")
            print(f"Response: {response.text}")

    except Exception as e:
        print(f"❌ Events Fetch ERROR ({str(e)})")

if __name__ == "__main__":
    load_env()
    fetch_gcal_events()
