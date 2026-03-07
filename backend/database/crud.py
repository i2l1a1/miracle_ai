from database.data_base_models import QuestionDBModel, AnswerDBModel, VoteDBModel
from schemas.pydantic_schemas import QuestionSchema, AnswerSchema, AnswerCreateSchema, VoteSchema
from database.data_base_init import SessionLocal
from sqlalchemy import select, and_


async def get_all_questions_crud():
    async with SessionLocal() as db:
        result = await db.execute(select(QuestionDBModel))
        questions = result.scalars().all()
        return [QuestionSchema.model_validate(q) for q in questions]


async def get_questions_by_username_crud(username: str):
    async with SessionLocal() as db:
        result = await db.execute(
            select(QuestionDBModel).where(QuestionDBModel.username == username)
        )
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


async def get_question_crud(question_id: int, username: str | None = None):
    async with SessionLocal() as db:
        q_result = await db.execute(select(QuestionDBModel).where(QuestionDBModel.id == question_id))
        question = q_result.scalar_one_or_none()
        if not question:
            return {"is_ok": False, "message": f"Question with id {question_id} not found"}

        if username:
            stmt = (
                select(AnswerDBModel, VoteDBModel.vote_type)
                .outerjoin(
                    VoteDBModel,
                    and_(
                        VoteDBModel.answer_id == AnswerDBModel.id,
                        VoteDBModel.username == username,
                    ),
                )
                .where(AnswerDBModel.question_id == question_id)
            )
            rows = (await db.execute(stmt)).all()
            answers_data = []
            for a, vote_type in rows:
                d = AnswerSchema.model_validate(a).model_dump()
                d["current_vote"] = vote_type
                answers_data.append(d)
        else:
            a_result = await db.execute(select(AnswerDBModel).where(AnswerDBModel.question_id == question_id))
            answers = a_result.scalars().all()
            answers_data = [AnswerSchema.model_validate(a).model_dump() for a in answers]

        return {
            "is_ok": True,
            "question": QuestionSchema.model_validate(question),
            "answers": answers_data,
        }


async def add_answer_crud(payload: AnswerCreateSchema):
    async with SessionLocal() as db:
        q_result = await db.execute(
            select(QuestionDBModel).where(QuestionDBModel.id == payload.question_id)
        )
        if q_result.scalar_one_or_none() is None:
            return {"is_ok": False, "message": f"Question with id {payload.question_id} not found"}

        new_answer = AnswerDBModel(**payload.model_dump())
        db.add(new_answer)
        await db.commit()
        await db.refresh(new_answer)
        return {"is_ok": True, "id": new_answer.id, "answer": AnswerSchema.model_validate(new_answer)}


async def vote_answer_crud(payload: VoteSchema):
    async with SessionLocal() as db:
        a_result = await db.execute(select(AnswerDBModel).where(AnswerDBModel.id == payload.answer_id))
        answer = a_result.scalar_one_or_none()
        if not answer:
            return {"is_ok": False, "message": "Answer not found"}
        v_result = await db.execute(
            select(VoteDBModel).where(
                and_(VoteDBModel.answer_id == payload.answer_id, VoteDBModel.username == payload.username)
            )
        )
        vote = v_result.scalar_one_or_none()
        if vote is None:
            db.add(VoteDBModel(answer_id=payload.answer_id, username=payload.username, vote_type=payload.vote_type))
            answer.rating += payload.vote_type
        elif vote.vote_type == payload.vote_type:
            await db.delete(vote)
            answer.rating -= payload.vote_type
        else:
            vote.vote_type = payload.vote_type
            answer.rating += payload.vote_type * 2
        await db.commit()
        await db.refresh(answer)
        return {"is_ok": True, "rating": answer.rating}
