import os

from fastapi import APIRouter, Depends, HTTPException, status

from services.generation.ai_answer_generate import generate_answer_text
from database.crud import (
    get_all_questions_crud,
    get_questions_by_user_id_crud,
    get_answers_by_user_id_crud,
    add_new_question_crud,
    soft_delete_question_crud,
    soft_delete_answer_crud,
    get_question_crud,
    add_answer_crud,
    vote_answer_crud,
    get_ai_answer_if_exists_crud,
    save_ai_answer_crud,
)
from schemas.pydantic_schemas import QuestionSchema, AnswerCreateSchema, VoteSchema
from security.authSecurity import get_current_user, get_current_user_optional
from database.data_base_models import User

router = APIRouter()


@router.get("/all_questions")
async def get_all_questions():
    return await get_all_questions_crud()


@router.get("/my-questions")
async def get_my_questions(current_user: User = Depends(get_current_user)):
    return await get_questions_by_user_id_crud(current_user.id)


@router.get("/my-answers")
async def get_my_answers(current_user: User = Depends(get_current_user)):
    return await get_answers_by_user_id_crud(current_user.id)


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

    text = await generate_answer_text(q.title, q.text)

    saved = await save_ai_answer_crud(question_id, text)

    return {
        "is_ok": True,
        "created": saved["created"],
        "answer": saved["answer"].model_dump(),
    }
