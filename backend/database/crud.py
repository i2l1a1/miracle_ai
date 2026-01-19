from database.data_base_models import QuestionDBModel
from schemas.pydantic_schemas import QuestionSchema
from database.data_base_init import SessionLocal
from sqlalchemy import select


async def get_all_questions_crud():
    async with SessionLocal() as db:
        result = await db.execute(select(QuestionDBModel))
        questions = result.scalars().all()
        return [QuestionSchema.model_validate(q) for q in questions]


async def add_new_question_crud(questions: QuestionSchema):
    async with SessionLocal() as db:
        new_question = QuestionDBModel(**dict(questions))

        db.add(new_question)
        await db.commit()
        await db.refresh(new_question)

        return {"is_ok": True, "id": new_question.id}


async def delete_question_crud(question_id: int):
    async with SessionLocal() as db:
        result = await db.execute(select(QuestionDBModel).where(QuestionDBModel.id == question_id))
        question = result.scalar_one_or_none()

        if not question:
            return {"is_ok": False, "message": f"Question with id {question_id} not found"}

        await db.delete(question)
        await db.commit()

        return {"is_ok": True, "id": question_id}
