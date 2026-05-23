from unittest.mock import AsyncMock, patch

import pytest

from tests.conftest import login_user, register_user, unique_name

pytestmark = pytest.mark.integration


@pytest.mark.asyncio
async def test_auth_register_login_verify_logout(client):
    username = unique_name("auth")
    password = "secret123"
    await register_user(client, username, password)
    await login_user(client, username, password)

    verify = await client.get("/verify-token")
    assert verify.status_code == 200
    assert verify.json()["username"] == username

    logout = await client.post("/logout")
    assert logout.status_code == 200

    verify_after = await client.get("/verify-token")
    assert verify_after.status_code == 401


@pytest.mark.asyncio
async def test_add_question_requires_auth(client):
    response = await client.post(
        "/add_new_question",
        json={
            "user_id": 1,
            "username": "x",
            "title": "T",
            "text": "Body",
            "tags": [],
        },
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_question_dedupes_tags_on_get(client):
    username = unique_name("tags")
    await register_user(client, username, "pass12345")
    await login_user(client, username, "pass12345")

    created = await client.post(
        "/add_new_question",
        json={
            "user_id": 0,
            "username": "",
            "title": "Tags",
            "text": "Body",
            "tags": ["Python", "Python", "  Python  "],
        },
    )
    assert created.status_code == 200
    qid = created.json()["id"]

    detail = await client.get(f"/get_question/{qid}")
    assert detail.status_code == 200
    tags = detail.json()["question"]["tags"]
    assert tags == ["Python"]


@pytest.mark.asyncio
async def test_delete_question_forbidden_for_non_owner(client):
    owner = unique_name("owner")
    other = unique_name("other")
    await register_user(client, owner, "pass12345")
    await register_user(client, other, "pass12345")
    await login_user(client, owner, "pass12345")

    created = await client.post(
        "/add_new_question",
        json={
            "user_id": 0,
            "username": "",
            "title": "Mine",
            "text": "Body",
            "tags": [],
        },
    )
    qid = created.json()["id"]

    await login_user(client, other, "pass12345")
    deleted = await client.delete(f"/delete_question/{qid}")
    assert deleted.status_code == 403


@pytest.mark.asyncio
async def test_human_answer_increments_count_bot_does_not(client):
    username = unique_name("counts")
    await register_user(client, username, "pass12345")
    await login_user(client, username, "pass12345")

    created = await client.post(
        "/add_new_question",
        json={
            "user_id": 0,
            "username": "",
            "title": "Count",
            "text": "Body",
            "tags": [],
        },
    )
    qid = created.json()["id"]

    answer = await client.post(
        "/add_answer",
        json={
            "question_id": qid,
            "user_id": 0,
            "username": "",
            "text": "Human reply",
            "is_bot": False,
        },
    )
    assert answer.status_code == 200

    detail = await client.get(f"/get_question/{qid}")
    assert detail.json()["question"]["answers_count"] == 1

    with patch(
        "routers.routers.generate_answer_text",
        new_callable=AsyncMock,
        return_value="Bot answer",
    ):
        gen = await client.post(f"/generate_ai_answer/{qid}")
    assert gen.status_code == 200

    detail_after = await client.get(f"/get_question/{qid}")
    assert detail_after.json()["question"]["answers_count"] == 1


@pytest.mark.asyncio
async def test_vote_same_direction_toggles_rating(client):
    author = unique_name("voter_author")
    voter = unique_name("voter")
    await register_user(client, author, "pass12345")
    await register_user(client, voter, "pass12345")
    await login_user(client, author, "pass12345")

    qid = (
        await client.post(
            "/add_new_question",
            json={
                "user_id": 0,
                "username": "",
                "title": "Vote",
                "text": "Body",
                "tags": [],
            },
        )
    ).json()["id"]

    aid = (
        await client.post(
            "/add_answer",
            json={
                "question_id": qid,
                "user_id": 0,
                "username": "",
                "text": "Answer",
                "is_bot": False,
            },
        )
    ).json()["id"]

    await login_user(client, voter, "pass12345")
    up1 = await client.post(
        "/vote_answer",
        json={"answer_id": aid, "user_id": 0, "vote_type": 1},
    )
    assert up1.status_code == 200
    assert up1.json()["rating"] == 1

    up2 = await client.post(
        "/vote_answer",
        json={"answer_id": aid, "user_id": 0, "vote_type": 1},
    )
    assert up2.status_code == 200
    assert up2.json()["rating"] == 0


@pytest.mark.asyncio
async def test_accept_answer_forbidden_for_non_owner(client):
    owner = unique_name("acc_owner")
    other = unique_name("acc_other")
    await register_user(client, owner, "pass12345")
    await register_user(client, other, "pass12345")
    await login_user(client, owner, "pass12345")

    qid = (
        await client.post(
            "/add_new_question",
            json={
                "user_id": 0,
                "username": "",
                "title": "Accept",
                "text": "Body",
                "tags": [],
            },
        )
    ).json()["id"]

    aid = (
        await client.post(
            "/add_answer",
            json={
                "question_id": qid,
                "user_id": 0,
                "username": "",
                "text": "Answer",
                "is_bot": False,
            },
        )
    ).json()["id"]

    await login_user(client, other, "pass12345")
    accepted = await client.post(f"/accept_answer/{aid}")
    assert accepted.status_code == 403


@pytest.mark.asyncio
async def test_generate_ai_answer_persists_posted_bot(client):
    username = unique_name("ai")
    await register_user(client, username, "pass12345")
    await login_user(client, username, "pass12345")

    qid = (
        await client.post(
            "/add_new_question",
            json={
                "user_id": 0,
                "username": "",
                "title": "AI",
                "text": "Body",
                "tags": [],
            },
        )
    ).json()["id"]

    with patch(
        "routers.routers.generate_answer_text",
        new_callable=AsyncMock,
        return_value="Mocked AI text",
    ):
        gen = await client.post(f"/generate_ai_answer/{qid}")

    assert gen.status_code == 200
    body = gen.json()
    assert body["created"] is True
    assert body["answer"]["status"] == "posted"
    assert body["answer"]["is_bot"] is True
    assert body["answer"]["text"] == "Mocked AI text"

    detail = await client.get(f"/get_question/{qid}")
    bot_answers = [a for a in detail.json()["answers"] if a["is_bot"]]
    assert len(bot_answers) == 1
    assert bot_answers[0]["text"] == "Mocked AI text"


@pytest.mark.asyncio
async def test_generate_ai_answer_second_call_is_idempotent(client):
    username = unique_name("ai_idem")
    await register_user(client, username, "pass12345")
    await login_user(client, username, "pass12345")

    qid = (
        await client.post(
            "/add_new_question",
            json={
                "user_id": 0,
                "username": "",
                "title": "Idem",
                "text": "Body",
                "tags": [],
            },
        )
    ).json()["id"]

    mock_gen = AsyncMock(return_value="Once")
    with patch("routers.routers.generate_answer_text", mock_gen):
        first = await client.post(f"/generate_ai_answer/{qid}")
        second = await client.post(f"/generate_ai_answer/{qid}")

    assert first.json()["answer"]["id"] == second.json()["answer"]["id"]
    assert second.json()["created"] is False
    assert mock_gen.await_count == 1


@pytest.mark.asyncio
async def test_all_questions_ai_generating_flag(client):
    username = unique_name("gen_flag")
    await register_user(client, username, "pass12345")
    await login_user(client, username, "pass12345")

    qid = (
        await client.post(
            "/add_new_question",
            json={
                "user_id": 0,
                "username": "",
                "title": "Flag",
                "text": "Body",
                "tags": [],
            },
        )
    ).json()["id"]

    me = await client.get("/verify-token")
    owner_id = me.json()["user_id"]

    from database import crud as crud_module

    reserved = await crud_module.create_or_get_generating_ai_answer_crud(qid, owner_id)
    assert reserved["is_ok"] is True

    listing = await client.get("/all_questions")
    assert listing.status_code == 200
    row = next(q for q in listing.json()["questions"] if q["id"] == qid)
    assert row["ai_generating"] is True

    saved = await crud_module.save_ai_answer_crud(qid, "Done")
    assert saved["is_ok"] is True

    listing_after = await client.get("/all_questions")
    row_after = next(q for q in listing_after.json()["questions"] if q["id"] == qid)
    assert row_after["ai_generating"] is False


@pytest.mark.asyncio
async def test_only_ai_answered_filter_excludes_human_replies(client):
    username = unique_name("filter")
    await register_user(client, username, "pass12345")
    await login_user(client, username, "pass12345")

    qid = (
        await client.post(
            "/add_new_question",
            json={
                "user_id": 0,
                "username": "",
                "title": "Filter",
                "text": "Body",
                "tags": [],
            },
        )
    ).json()["id"]

    with patch(
        "routers.routers.generate_answer_text",
        new_callable=AsyncMock,
        return_value="Bot only",
    ):
        await client.post(f"/generate_ai_answer/{qid}")

    only_ai = await client.get("/all_questions", params={"only_ai_answered": "true"})
    ids_ai = {q["id"] for q in only_ai.json()["questions"]}
    assert qid in ids_ai

    await client.post(
        "/add_answer",
        json={
            "question_id": qid,
            "user_id": 0,
            "username": "",
            "text": "Human",
            "is_bot": False,
        },
    )

    only_ai_after = await client.get("/all_questions", params={"only_ai_answered": "true"})
    ids_after = {q["id"] for q in only_ai_after.json()["questions"]}
    assert qid not in ids_after


@pytest.mark.asyncio
async def test_get_deleted_question_returns_not_found(client):
    username = unique_name("del")
    await register_user(client, username, "pass12345")
    await login_user(client, username, "pass12345")

    qid = (
        await client.post(
            "/add_new_question",
            json={
                "user_id": 0,
                "username": "",
                "title": "Del",
                "text": "Body",
                "tags": [],
            },
        )
    ).json()["id"]

    deleted = await client.delete(f"/delete_question/{qid}")
    assert deleted.status_code == 200

    detail = await client.get(f"/get_question/{qid}")
    assert detail.status_code == 200
    assert detail.json()["is_ok"] is False


@pytest.mark.asyncio
async def test_all_questions_invalid_sort_returns_400(client):
    response = await client.get("/all_questions", params={"sort": "invalid"})
    assert response.status_code == 400
