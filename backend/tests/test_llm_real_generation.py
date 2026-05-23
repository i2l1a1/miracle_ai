import os
import secrets

import pytest

from tests.conftest import login_user, register_user, unique_name

pytestmark = [pytest.mark.llm, pytest.mark.integration]

LLM_REQUEST_TIMEOUT_SEC = 600.0

QUESTION_TITLE = "How do I reverse a string in Python?"
QUESTION_BODY = (
    "I need to reverse the string hello in Python 3. What is the simplest way?"
)


def _require_openrouter() -> None:
    key = (os.getenv("OPENROUTER_API_KEY") or "").strip()
    if not key or key == "your_openrouter_api_key":
        pytest.skip("Set OPENROUTER_API_KEY in backend/.env to run real LLM tests")


@pytest.mark.asyncio
async def test_generate_ai_answer_api_real_openrouter(client):
    _require_openrouter()

    username = unique_name("llm_api")
    password = secrets.token_urlsafe(16)
    await register_user(client, username, password)
    await login_user(client, username, password)

    created = await client.post(
        "/add_new_question",
        json={
            "user_id": 0,
            "username": "",
            "title": QUESTION_TITLE,
            "text": QUESTION_BODY,
            "tags": ["python"],
        },
    )
    assert created.status_code == 200
    qid = created.json()["id"]

    gen = await client.post(
        f"/generate_ai_answer/{qid}",
        timeout=LLM_REQUEST_TIMEOUT_SEC,
    )
    assert gen.status_code == 200, gen.text
    payload = gen.json()
    assert payload["is_ok"] is True
    assert payload["created"] is True
    assert payload["answer"]["is_bot"] is True
    assert payload["answer"]["status"] == "posted"

    answer_text = (payload["answer"]["text"] or "").strip()
    assert len(answer_text) >= 10

    detail = await client.get(f"/get_question/{qid}")
    assert detail.status_code == 200
    bots = [a for a in detail.json()["answers"] if a["is_bot"]]
    assert len(bots) == 1
    assert len(bots[0]["text"].strip()) >= 10
