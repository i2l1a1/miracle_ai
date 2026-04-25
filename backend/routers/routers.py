from asyncio import Lock

from fastapi import APIRouter, Depends, HTTPException, Query, status

from services.generation.ai_answer_generate import generate_answer_text
from database.crud import (
    get_questions_by_user_id_crud,
    get_answers_by_user_id_crud,
    add_new_question_crud,
    soft_delete_question_crud,
    soft_delete_answer_crud,
    get_question_crud,
    add_answer_crud,
    vote_answer_crud,
    accept_answer_crud,
    get_ai_answer_if_exists_crud,
    save_ai_answer_crud,
    get_bot_answer_row_after_lock_crud,
    create_or_get_generating_ai_answer_crud,
    get_questions_paginated_crud,
)
from schemas.pydantic_schemas import QuestionSchema, AnswerCreateSchema, VoteSchema, AnswerSchema
from security.authSecurity import get_current_user, get_current_user_optional
from database.data_base_models import User

router = APIRouter()

_generate_ai_locks: dict[int, Lock] = {}


def _generate_ai_lock(question_id: int) -> Lock:
    if question_id not in _generate_ai_locks:
        _generate_ai_locks[question_id] = Lock()
    return _generate_ai_locks[question_id]


_HOME_SORT_VALUES = frozenset({"newest", "oldest", "most_answers", "fewest_answers"})


@router.get("/all_questions")
async def get_all_questions(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    sort: str = Query("newest"),
    only_ai_answered: bool = Query(False),
    tags: str = Query(""),
):
    if sort not in _HOME_SORT_VALUES:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="Invalid sort; use newest, oldest, most_answers, or fewest_answers",
        )
    tag_list = [t.strip().lower() for t in tags.split(",") if t.strip()]
    return await get_questions_paginated_crud(
        page=page,
        page_size=page_size,
        sort_by=sort,
        only_ai_answered=only_ai_answered,
        tags=tag_list,
    )


@router.get("/my-questions")
async def get_my_questions(
    current_user: User = Depends(get_current_user),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
):
    return await get_questions_by_user_id_crud(current_user.id, page, page_size)


@router.get("/my-answers")
async def get_my_answers(
    current_user: User = Depends(get_current_user),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
):
    return await get_answers_by_user_id_crud(current_user.id, page, page_size)


@router.post("/add_new_question")
async def add_new_question(
    question: QuestionSchema,
    current_user: User = Depends(get_current_user),
):
    question.user_id = current_user.id
    question.username = current_user.username
    return await add_new_question_crud(question)


@router.delete("/delete_question/{question_id}")
async def delete_question(
    question_id: int,
    current_user: User = Depends(get_current_user),
):
    result = await soft_delete_question_crud(question_id, current_user.id)
    if not result["is_ok"]:
        if result.get("error") == "forbidden":
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                detail="Not allowed to delete this question",
            )
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Question not found")
    return result


@router.delete("/delete_answer/{answer_id}")
async def delete_answer(
    answer_id: int,
    current_user: User = Depends(get_current_user),
):
    result = await soft_delete_answer_crud(answer_id, current_user.id)
    if not result["is_ok"]:
        if result.get("error") == "forbidden":
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                detail="Not allowed to delete this answer",
            )
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Answer not found")
    return result


@router.get("/get_question/{question_id}")
async def get_question(
    question_id: int,
    current_user: User | None = Depends(get_current_user_optional),
):
    user_id = current_user.id if current_user else None
    return await get_question_crud(question_id, user_id)


@router.post("/add_answer")
async def add_answer(
    payload: AnswerCreateSchema,
    current_user: User = Depends(get_current_user),
):
    payload.user_id = current_user.id
    payload.username = current_user.username
    return await add_answer_crud(payload)


@router.post("/vote_answer")
async def vote_answer(
    payload: VoteSchema,
    current_user: User = Depends(get_current_user),
):
    payload.user_id = current_user.id
    return await vote_answer_crud(payload)


@router.post("/accept_answer/{answer_id}")
async def accept_answer(
    answer_id: int,
    current_user: User = Depends(get_current_user),
):
    result = await accept_answer_crud(answer_id, current_user.id)
    if not result["is_ok"]:
        if result.get("error") == "forbidden":
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                detail="Not allowed to accept this answer",
            )
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Answer not found")
    return {
        "is_ok": True,
        "answer": result["answer"].model_dump(),
    }


@router.post("/generate_ai_answer/{question_id}")
async def generate_ai_answer(
    question_id: int,
):
    data = await get_question_crud(question_id, None)
    if not data["is_ok"]:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            detail=data.get("message", "Question not found"),
        )
    q = data["question"]

    existing = await get_ai_answer_if_exists_crud(question_id)
    if existing:
        return {
            "is_ok": True,
            "created": False,
            "answer": existing.model_dump(),
        }

    async with _generate_ai_lock(question_id):
        row = await get_bot_answer_row_after_lock_crud(question_id)
        if row and row.status in {"posted", "generating"}:
            return {
                "is_ok": True,
                "created": False,
                "answer": AnswerSchema.model_validate(row).model_dump(),
            }

        reserved = await create_or_get_generating_ai_answer_crud(question_id, q.user_id)
        if not reserved.get("is_ok"):
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                detail=reserved.get("message", "Failed to reserve AI generation"),
            )
        if not reserved.get("created"):
            return {
                "is_ok": True,
                "created": False,
                "answer": reserved["answer"].model_dump(),
            }

        text = await generate_answer_text(q.title, q.text)
        saved = await save_ai_answer_crud(question_id, text)
        if not saved.get("is_ok"):
            raise HTTPException(
                status.HTTP_404_NOT_FOUND,
                detail=saved.get("message", "Failed to save answer"),
            )
        return {
            "is_ok": True,
            "created": saved["created"],
            "answer": saved["answer"].model_dump(),
        }
