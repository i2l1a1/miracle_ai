import argparse
import os

from datetime import datetime
from pathlib import Path
import requests
from dotenv import load_dotenv

parser = argparse.ArgumentParser()

parser.add_argument("--url", required=True, help="Base URL")
parser.add_argument(
    "--fromdate",
    required=True,
    help="Start datetime in format YYYY-MM-DD HH:MM:SS",
)
parser.add_argument(
    "--todate",
    required=True,
    help="End datetime in format YYYY-MM-DD HH:MM:SS",
)
parser.add_argument(
    "--workers",
    type=int,
    default=8,
    help="Number of workers for AI generation",
)

args = parser.parse_args()

fromdate = datetime.strptime(args.fromdate, "%Y-%m-%d %H:%M:%S")
todate = datetime.strptime(args.todate, "%Y-%m-%d %H:%M:%S")

if fromdate >= todate:
    raise ValueError("fromdate must be earlier than todate")

load_dotenv(dotenv_path=Path(__file__).resolve().parents[1] / ".env")
username = os.getenv("USERNAME_FOR_PARSING")
password = os.getenv("PASSWORD_FOR_PARSING")
if not username or not password:
    raise RuntimeError("Set USERNAME_FOR_PARSING and PASSWORD_FOR_PARSING in backend/.env")

session = requests.Session()
login_response = session.post(
    f"{args.url.rstrip('/')}/token",
    data={"username": username, "password": password},
    timeout=30,
)
if not login_response.ok:
    raise RuntimeError(f"Login failed: {login_response.text}")

run_response = session.post(
    f"{args.url.rstrip('/')}/run_stackoverflow_publishing",
    json={
        "fromdate": fromdate.isoformat(),
        "todate": todate.isoformat(),
        "generation_workers": args.workers,
        "api_url": args.url,
    },
)
if not run_response.ok:
    raise RuntimeError(f"Publishing failed: {run_response.status_code} {run_response.text}")

print("Publishing completed")
