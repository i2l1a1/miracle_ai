from database.data_base_models import QuestionDBModel, AnswerDBModel, VoteDBModel, User
from schemas.pydantic_schemas import (
    QuestionSchema,
    AnswerSchema,
    AnswerWithQuestionSchema,
    AnswerCreateSchema,
    VoteSchema,
)
from database.data_base_init import SessionLocal
from sqlalchemy import select, and_


async def get_all_questions_crud():
    async with SessionLocal() as db:
        result = await db.execute(select(QuestionDBModel))
        questions = result.scalars().all()
        return [QuestionSchema.model_validate(q) for q in questions]


async def get_questions_by_user_id_crud(user_id: int):
    async with SessionLocal() as db:
        result = await db.execute(
            select(QuestionDBModel).where(QuestionDBModel.user_id == user_id)
        )
        questions = result.scalars().all()
        return [QuestionSchema.model_validate(q) for q in questions]


async def add_new_question_crud(question: QuestionSchema):
    async with SessionLocal() as db:
        new_question = QuestionDBModel(**dict(question))

        db.add(new_question)
        user_result = await db.execute(
            select(User).where(User.id == question.user_id)
        )
        user = user_result.scalar_one_or_none()
        if user:
            user.questions_count += 1
        await db.commit()
        await db.refresh(new_question)

        return {"is_ok": True, "id": new_question.id}


async def delete_question_crud(question_id: int):
    async with SessionLocal() as db:
        result = await db.execute(
            select(QuestionDBModel).where(QuestionDBModel.id == question_id)
        )
        question = result.scalar_one_or_none()

        if not question:
            return {"is_ok": False, "message": f"Question with id {question_id} not found"}

        await db.delete(question)
        await db.commit()

        return {"is_ok": True, "id": question_id}


async def get_question_crud(question_id: int, user_id: int | None = None):
    async with SessionLocal() as db:
        q_result = await db.execute(
            select(QuestionDBModel).where(QuestionDBModel.id == question_id)
        )
        question = q_result.scalar_one_or_none()
        if not question:
            return {"is_ok": False, "message": f"Question with id {question_id} not found"}

        if user_id is not None:
            stmt = (
                select(AnswerDBModel, VoteDBModel.vote_type)
                .outerjoin(
                    VoteDBModel,
                    and_(
                        VoteDBModel.answer_id == AnswerDBModel.id,
                        VoteDBModel.user_id == user_id,
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
            a_result = await db.execute(
                select(AnswerDBModel).where(AnswerDBModel.question_id == question_id)
            )
            answers = a_result.scalars().all()
            answers_data = [
                AnswerSchema.model_validate(a).model_dump() for a in answers
            ]

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
            return {
                "is_ok": False,
                "message": f"Question with id {payload.question_id} not found",
            }

        new_answer = AnswerDBModel(
            question_id=payload.question_id,
            user_id=payload.user_id,
            username=payload.username,
            text=payload.text,
            is_bot=payload.is_bot,
        )
        db.add(new_answer)
        question_result = await db.execute(
            select(QuestionDBModel).where(QuestionDBModel.id == payload.question_id)
        )
        question = question_result.scalar_one_or_none()
        if question:
            question.answers_count += 1
        user_result = await db.execute(
            select(User).where(User.id == payload.user_id)
        )
        user = user_result.scalar_one_or_none()
        if user:
            user.answers_count += 1
        await db.commit()
        await db.refresh(new_answer)
        await db.refresh(question)
        return {
            "is_ok": True,
            "id": new_answer.id,
            "answer": AnswerSchema.model_validate(new_answer),
        }


async def get_answers_by_user_id_crud(user_id: int):
    async with SessionLocal() as db:
        stmt = (
            select(AnswerDBModel, QuestionDBModel.title)
            .join(QuestionDBModel, AnswerDBModel.question_id == QuestionDBModel.id)
            .where(AnswerDBModel.user_id == user_id)
        )
        rows = (await db.execute(stmt)).all()
        return [
            AnswerWithQuestionSchema(
                **AnswerSchema.model_validate(a).model_dump(),
                question_id=a.question_id,
                question_title=title,
            )
            for a, title in rows
        ]


async def vote_answer_crud(payload: VoteSchema):
    async with SessionLocal() as db:
        a_result = await db.execute(
            select(AnswerDBModel).where(AnswerDBModel.id == payload.answer_id)
        )
        answer = a_result.scalar_one_or_none()
        if not answer:
            return {"is_ok": False, "message": "Answer not found"}
        v_result = await db.execute(
            select(VoteDBModel).where(
                and_(
                    VoteDBModel.answer_id == payload.answer_id,
                    VoteDBModel.user_id == payload.user_id,
                )
            )
        )
        vote = v_result.scalar_one_or_none()
        if vote is None:
            db.add(
                VoteDBModel(
                    answer_id=payload.answer_id,
                    user_id=payload.user_id,
                    vote_type=payload.vote_type,
                )
            )
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
