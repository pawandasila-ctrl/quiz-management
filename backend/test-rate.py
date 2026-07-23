import requests
import sys

def main():
    # Hit the local backend API directly
    url = "http://localhost:5001/api/auth/login"
    payload = {
        "email": "rate_limit_test@example.com",
        "password": "wrongpassword123"
    }

    print("==================================================")
    # The login endpoint is limited to 10 requests per minute.
    # We will make 12 requests to trigger the 429 rate limit error.
    print(f"Starting test: Sending 12 requests to {url}...")
    print("Expected: First 10 get HTTP 401 (Incorrect password), 11 & 12 get HTTP 429 (Rate limit exceeded).")
    print("==================================================\n")

    try:
        # Check if server is running
        requests.get("http://localhost:5001/health", timeout=2)
    except requests.exceptions.ConnectionError:
        print("Error: The backend server is not running on http://localhost:5001.")
        print("Please start the backend server with 'uvicorn main:app --reload --port 5001' and rerun this script.")
        sys.exit(1)
    except Exception:
        # It's okay if /health doesn't exist, we just want to ensure connection works
        pass

    for i in range(1, 13):
        try:
            res = requests.post(url, json=payload, timeout=5)
            status = res.status_code
            text = res.text.strip()
            print(f"Request #{i:02d}: HTTP {status} | Response: {text}")
        except Exception as e:
            print(f"Request #{i:02d} failed: {e}")
            break

if __name__ == "__main__":
    main()

