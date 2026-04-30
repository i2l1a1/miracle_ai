import json
import sys
from typing import Any
from dotenv import load_dotenv
import os
import requests

load_dotenv(dotenv_path="../.env")


def ensure_ok(response: requests.Response, action: str) -> dict[str, Any]:
    try:
        data = response.json()
    except json.JSONDecodeError:
        raise RuntimeError(f"{action} failed: non-JSON response ({response.status_code})")

    if not response.ok:
        detail = data.get("detail") or data.get("message") or response.text
        raise RuntimeError(f"{action} failed ({response.status_code}): {detail}")

    return data


def login(session: requests.Session, api_url: str, username: str, password: str) -> None:
    session.post(
        f"{api_url.rstrip('/')}/token",
        data={"username": username, "password": password},
        timeout=20,
    )


def create_question(
        session: requests.Session,
        api_url: str,
        username: str,
        title: str,
        text: str,
        tags: list[str],
) -> int:
    payload = {
        "id": None,
        "user_id": 0,
        "username": username,
        "title": title.strip(),
        "text": text.strip(),
        "tags": tags,
    }
    response = session.post(
        f"{api_url.rstrip('/')}/add_new_question",
        json=payload,
        timeout=20,
    )
    data = ensure_ok(response, "Create question")
    if not data.get("is_ok"):
        raise RuntimeError(f"Create question failed: {data}")
    qid = data.get("id")
    if not isinstance(qid, int):
        raise RuntimeError(f"Create question failed: question id is missing in response: {data}")
    return qid


def publish_question(api_url, question_title, question_text, question_tags) -> int:
    session = requests.Session()
    username = os.getenv("USERNAME_FOR_PARSING")
    password = os.getenv("PASSWORD_FOR_PARSING")

    try:
        login(session, api_url, username, password)
        question_id = create_question(
            session=session,
            api_url=api_url,
            username=username,
            title=question_title,
            text=question_text,
            tags=question_tags,
        )
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    print(f"Question published successfully. ID: {question_id}")
    print(f"URL: {api_url}/questions/{question_id}")
    return 0
