from fastapi import APIRouter

from database.crud import (
    get_all_questions_crud,
    get_questions_by_username_crud,
    get_answers_by_username_crud,
    add_new_question_crud,
    delete_question_crud,
    get_question_crud,
    add_answer_crud,
    vote_answer_crud,
)
from schemas.pydantic_schemas import QuestionSchema, AnswerCreateSchema, VoteSchema

router = APIRouter()


@router.get("/all_questions")
async def get_all_questions():
    return await get_all_questions_crud()


@router.get("/questions_by_user")
async def get_questions_by_user(username: str):
    return await get_questions_by_username_crud(username)


@router.get("/answers_by_user")
async def get_answers_by_user(username: str):
    return await get_answers_by_username_crud(username)


@router.post("/add_new_question")
async def add_new_question(questions: QuestionSchema):
    return await add_new_question_crud(questions)


@router.delete("/delete_question/{question_id}")
async def delete_question(question_id: int):
    return await delete_question_crud(question_id)


@router.get("/get_question/{question_id}")
async def get_question(question_id: int, username: str | None = None):
    return await get_question_crud(question_id, username)


@router.post("/add_answer")
async def add_answer(payload: AnswerCreateSchema):
    return await add_answer_crud(payload)


@router.post("/vote_answer")
async def vote_answer(payload: VoteSchema):
    return await vote_answer_crud(payload)
