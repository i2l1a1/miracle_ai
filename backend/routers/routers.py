from fastapi import APIRouter

from database.crud import get_all_questions_crud, add_new_question_crud, delete_question_crud
from schemas.pydantic_schemas import QuestionSchema

router = APIRouter()


@router.get("/all_questions")
async def get_all_questions():
    return await get_all_questions_crud()


@router.post("/add_new_question")
async def add_new_question(questions: QuestionSchema):
    return await add_new_question_crud(questions)


@router.delete("/delete_question/{question_id}")
async def delete_question(question_id: int):
    return await delete_question_crud(question_id)
