from database.data_base_models import (
    QuestionDBModel,
    QuestionTagDBModel,
    AnswerDBModel,
    VoteDBModel,
    User,
)
from schemas.pydantic_schemas import (
    QuestionSchema,
    AnswerSchema,
    AnswerWithQuestionSchema,
    AnswerCreateSchema,
    VoteSchema,
)
from typing import List, Optional

from database.data_base_init import SessionLocal
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import IntegrityError


async def get_questions_paginated_crud(
        page: int,
        page_size: int,
        sort_by: str,
        only_ai_answered: bool,
        tags: List[str],
) -> dict:
    async with SessionLocal() as db:
        conditions = [QuestionDBModel.is_deleted.is_(False)]
        if only_ai_answered:
            conditions.append(QuestionDBModel.answers_count == 0)
        for raw in tags:
            t = (raw or "").strip().lower()
            if not t:
                continue
            conditions.append(
                QuestionDBModel.tag_rows.any(
                    func.lower(QuestionTagDBModel.tag) == t
                )
            )

        where_clause = and_(*conditions)

        count_result = await db.execute(
            select(func.count()).select_from(QuestionDBModel).where(where_clause)
        )
        total = int(count_result.scalar_one() or 0)

        if sort_by == "oldest":
            order_cols = (QuestionDBModel.date_added.asc(), QuestionDBModel.id.asc())
        elif sort_by == "most_answers":
            order_cols = (QuestionDBModel.answers_count.desc(), QuestionDBModel.id.desc())
        elif sort_by == "fewest_answers":
            order_cols = (QuestionDBModel.answers_count.asc(), QuestionDBModel.id.asc())
        else:
            order_cols = (QuestionDBModel.date_added.desc(), QuestionDBModel.id.desc())

        offset = (page - 1) * page_size
        result = await db.execute(
            select(QuestionDBModel)
            .options(selectinload(QuestionDBModel.tag_rows))
            .where(where_clause)
            .order_by(*order_cols)
            .offset(offset)
            .limit(page_size)
        )
        questions = result.scalars().all()
        serialized = [
            QuestionSchema.model_validate(q).model_dump(mode="json") for q in questions
        ]
        total_pages = (total + page_size - 1) // page_size if total > 0 else 0
        return {
            "is_ok": True,
            "questions": serialized,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
        }


async def get_questions_by_user_id_crud(user_id: int, page: int, page_size: int) -> dict:
    async with SessionLocal() as db:
        base_where = and_(
            QuestionDBModel.user_id == user_id,
            QuestionDBModel.is_deleted.is_(False),
        )
        count_result = await db.execute(
            select(func.count()).select_from(QuestionDBModel).where(base_where)
        )
        total = int(count_result.scalar_one() or 0)
        order_cols = (QuestionDBModel.date_added.desc(), QuestionDBModel.id.desc())
        offset = (page - 1) * page_size
        result = await db.execute(
            select(QuestionDBModel)
            .options(selectinload(QuestionDBModel.tag_rows))
            .where(base_where)
            .order_by(*order_cols)
            .offset(offset)
            .limit(page_size)
        )
        questions = result.scalars().all()
        serialized = [
            QuestionSchema.model_validate(q).model_dump(mode="json") for q in questions
        ]
        total_pages = (total + page_size - 1) // page_size if total > 0 else 0
        return {
            "is_ok": True,
            "questions": serialized,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
        }


def _normalize_question_tags(raw: Optional[List[str]]) -> List[str]:
    seen: set = set()
    out: List[str] = []
    for t in raw or []:
        s = (t or "").strip()
        if s and s not in seen:
            seen.add(s)
            out.append(s)
    return out


async def add_new_question_crud(question: QuestionSchema):
    async with SessionLocal() as db:
        payload = question.model_dump(exclude={"tags"})
        if payload.get("id") is None:
            payload.pop("id", None)
        new_question = QuestionDBModel(**payload)
        for tag in _normalize_question_tags(question.tags):
            new_question.tag_rows.append(QuestionTagDBModel(tag=tag))

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


async def soft_delete_question_crud(question_id: int, owner_user_id: int) -> dict:
    async with SessionLocal() as db:
        q_result = await db.execute(
            select(QuestionDBModel).where(
                QuestionDBModel.id == question_id,
                QuestionDBModel.is_deleted.is_(False),
            )
        )
        question = q_result.scalar_one_or_none()
        if not question:
            return {"is_ok": False, "error": "not_found"}
        if question.user_id != owner_user_id:
            return {"is_ok": False, "error": "forbidden"}

        a_result = await db.execute(
            select(AnswerDBModel).where(
                AnswerDBModel.question_id == question_id,
                AnswerDBModel.is_deleted.is_(False),
            )
        )
        for answer in a_result.scalars().all():
            answer.is_deleted = True
            if not answer.is_bot:
                u = await db.get(User, answer.user_id)
                if u and u.answers_count > 0:
                    u.answers_count -= 1

        question.answers_count = 0
        question.is_deleted = True
        owner = await db.get(User, question.user_id)
        if owner and owner.questions_count > 0:
            owner.questions_count -= 1

        await db.commit()
        return {"is_ok": True, "id": question_id}


async def soft_delete_answer_crud(answer_id: int, owner_user_id: int) -> dict:
    async with SessionLocal() as db:
        a_result = await db.execute(
            select(AnswerDBModel).where(
                AnswerDBModel.id == answer_id,
                AnswerDBModel.is_deleted.is_(False),
            )
        )
        answer = a_result.scalar_one_or_none()
        if not answer:
            return {"is_ok": False, "error": "not_found"}
        if answer.user_id != owner_user_id:
            return {"is_ok": False, "error": "forbidden"}

        q_result = await db.execute(
            select(QuestionDBModel).where(
                QuestionDBModel.id == answer.question_id,
                QuestionDBModel.is_deleted.is_(False),
            )
        )
        question = q_result.scalar_one_or_none()
        if not question:
            return {"is_ok": False, "error": "not_found"}

        answer.is_deleted = True
        if not answer.is_bot:
            question.answers_count = max(0, question.answers_count - 1)
            u = await db.get(User, answer.user_id)
            if u and u.answers_count > 0:
                u.answers_count -= 1

        await db.commit()
        return {"is_ok": True, "id": answer_id}


async def get_question_crud(question_id: int, user_id: int | None = None):
    async with SessionLocal() as db:
        q_result = await db.execute(
            select(QuestionDBModel)
            .options(selectinload(QuestionDBModel.tag_rows))
            .where(
                QuestionDBModel.id == question_id,
                QuestionDBModel.is_deleted.is_(False),
            )
        )
        question = q_result.scalar_one_or_none()
        if not question:
            return {"is_ok": False, "message": f"Question with id {question_id} not found"}

        def sort_answers(items: list[AnswerDBModel]) -> list[AnswerDBModel]:
            def sort_key(a: AnswerDBModel):
                low_rated = a.rating < -3
                if low_rated:
                    return 1, a.date_added
                accepted_rank = 0 if a.is_accepted else 1
                bot_rank = 0 if a.is_bot else 1
                date_rank = -a.date_added.timestamp()
                return 0, accepted_rank, bot_rank, date_rank

            return sorted(items, key=sort_key)

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
                .where(
                    AnswerDBModel.question_id == question_id,
                    AnswerDBModel.is_deleted.is_(False),
                )
            )
            rows = (await db.execute(stmt)).all()
            ordered_answers = sort_answers([a for a, _ in rows])
            vote_by_answer_id = {a.id: vote_type for a, vote_type in rows}
            answers_data = []
            for a in ordered_answers:
                d = AnswerSchema.model_validate(a).model_dump()
                d["current_vote"] = vote_by_answer_id.get(a.id)
                answers_data.append(d)
        else:
            a_result = await db.execute(
                select(AnswerDBModel).where(
                    AnswerDBModel.question_id == question_id,
                    AnswerDBModel.is_deleted.is_(False),
                )
            )
            answers = sort_answers(a_result.scalars().all())
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
            select(QuestionDBModel).where(
                QuestionDBModel.id == payload.question_id,
                QuestionDBModel.is_deleted.is_(False),
            )
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
            select(QuestionDBModel).where(
                QuestionDBModel.id == payload.question_id,
                QuestionDBModel.is_deleted.is_(False),
            )
        )
        question = question_result.scalar_one_or_none()
        if question and not payload.is_bot:
            question.answers_count += 1
        user_result = await db.execute(
            select(User).where(User.id == payload.user_id)
        )
        user = user_result.scalar_one_or_none()
        if user and not payload.is_bot:
            user.answers_count += 1
        await db.commit()
        await db.refresh(new_answer)
        await db.refresh(question)
        return {
            "is_ok": True,
            "id": new_answer.id,
            "answer": AnswerSchema.model_validate(new_answer),
        }


async def get_answers_by_user_id_crud(user_id: int, page: int, page_size: int) -> dict:
    async with SessionLocal() as db:
        base_where = and_(
            AnswerDBModel.user_id == user_id,
            AnswerDBModel.is_bot == False,
            AnswerDBModel.is_deleted.is_(False),
            QuestionDBModel.is_deleted.is_(False),
        )
        count_stmt = (
            select(func.count())
            .select_from(AnswerDBModel)
            .join(QuestionDBModel, AnswerDBModel.question_id == QuestionDBModel.id)
            .where(base_where)
        )
        count_result = await db.execute(count_stmt)
        total = int(count_result.scalar_one() or 0)
        order_cols = (AnswerDBModel.date_added.desc(), AnswerDBModel.id.desc())
        offset = (page - 1) * page_size
        stmt = (
            select(AnswerDBModel, QuestionDBModel.title)
            .join(QuestionDBModel, AnswerDBModel.question_id == QuestionDBModel.id)
            .where(base_where)
            .order_by(*order_cols)
            .offset(offset)
            .limit(page_size)
        )
        rows = (await db.execute(stmt)).all()
        serialized = [
            AnswerWithQuestionSchema(
                **AnswerSchema.model_validate(a).model_dump(),
                question_id=a.question_id,
                question_title=title,
            ).model_dump(mode="json")
            for a, title in rows
        ]
        total_pages = (total + page_size - 1) // page_size if total > 0 else 0
        return {
            "is_ok": True,
            "answers": serialized,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
        }


async def vote_answer_crud(payload: VoteSchema):
    async with SessionLocal() as db:
        a_result = await db.execute(
            select(AnswerDBModel).where(
                AnswerDBModel.id == payload.answer_id,
                AnswerDBModel.is_deleted.is_(False),
            )
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


async def set_answer_accepted_crud(answer_id: int, owner_user_id: int, accepted: bool) -> dict:
    async with SessionLocal() as db:
        stmt = (
            select(AnswerDBModel, QuestionDBModel)
            .join(QuestionDBModel, AnswerDBModel.question_id == QuestionDBModel.id)
            .where(
                AnswerDBModel.id == answer_id,
                AnswerDBModel.is_deleted.is_(False),
                QuestionDBModel.is_deleted.is_(False),
            )
        )
        row = (await db.execute(stmt)).first()
        if not row:
            return {"is_ok": False, "error": "not_found"}
        answer, question = row
        if question.user_id != owner_user_id:
            return {"is_ok": False, "error": "forbidden"}

        rows = await db.execute(
            select(AnswerDBModel).where(
                AnswerDBModel.question_id == question.id,
                AnswerDBModel.is_deleted.is_(False),
            )
        )
        candidates = rows.scalars().all()
        for candidate in candidates:
            candidate.is_accepted = False
        await db.flush()
        if accepted:
            answer.is_accepted = True

        await db.commit()
        await db.refresh(answer)
        return {"is_ok": True, "answer": AnswerSchema.model_validate(answer)}


async def get_ai_answer_if_exists_crud(question_id: int):
    async with SessionLocal() as db:
        result = await db.execute(
            select(AnswerDBModel).where(
                AnswerDBModel.question_id == question_id,
                AnswerDBModel.is_bot == True,
                AnswerDBModel.is_deleted.is_(False),
                AnswerDBModel.status == "posted",
            )
        )
        row = result.scalar_one_or_none()
        if not row:
            return None
        return AnswerSchema.model_validate(row)


async def _get_bot_answer_model(db, question_id: int) -> Optional[AnswerDBModel]:
    r = await db.execute(
        select(AnswerDBModel).where(
            AnswerDBModel.question_id == question_id,
            AnswerDBModel.is_bot == True,
            AnswerDBModel.is_deleted.is_(False),
        )
    )
    return r.scalar_one_or_none()


async def get_bot_answer_row_after_lock_crud(question_id: int) -> Optional[AnswerDBModel]:
    async with SessionLocal() as db:
        return await _get_bot_answer_model(db, question_id)


async def create_or_get_generating_ai_answer_crud(question_id: int, owner_user_id: int):
    async with SessionLocal() as db:
        new_answer = AnswerDBModel(
            question_id=question_id,
            user_id=owner_user_id,
            username="AI BOT",
            text="",
            is_bot=True,
            status="generating",
        )
        db.add(new_answer)
        try:
            await db.commit()
            await db.refresh(new_answer)
            return {
                "is_ok": True,
                "created": True,
                "answer": AnswerSchema.model_validate(new_answer),
            }
        except IntegrityError:
            await db.rollback()
            ex_after = await db.execute(
                select(AnswerDBModel).where(
                    AnswerDBModel.question_id == question_id,
                    AnswerDBModel.is_bot == True,
                    AnswerDBModel.is_deleted.is_(False),
                )
            )
            row = ex_after.scalar_one_or_none()
            if not row:
                return {"is_ok": False, "message": "Failed to reserve AI generation"}
            return {
                "is_ok": True,
                "created": False,
                "answer": AnswerSchema.model_validate(row),
            }


async def save_ai_answer_crud(question_id: int, text: str):
    async with SessionLocal() as db:
        ex_result = await db.execute(
            select(AnswerDBModel).where(
                AnswerDBModel.question_id == question_id,
                AnswerDBModel.is_bot == True,
                AnswerDBModel.is_deleted.is_(False),
            )
        )
        existing = ex_result.scalar_one_or_none()
        if existing:
            if existing.status == "posted":
                return {
                    "is_ok": True,
                    "created": False,
                    "answer": AnswerSchema.model_validate(existing),
                }
            was_generating = existing.status == "generating"
            existing.text = text
            existing.status = "posted"
            await db.commit()
            await db.refresh(existing)
            return {
                "is_ok": True,
                "created": was_generating,
                "answer": AnswerSchema.model_validate(existing),
            }

        q_result = await db.execute(
            select(QuestionDBModel).where(
                QuestionDBModel.id == question_id,
                QuestionDBModel.is_deleted.is_(False),
            )
        )
        question = q_result.scalar_one_or_none()
        if not question:
            return {"is_ok": False, "message": f"Question with id {question_id} not found"}

        new_answer = AnswerDBModel(
            question_id=question_id,
            user_id=question.user_id,
            username="AI BOT",
            text=text,
            is_bot=True,
            status="posted",
        )
        db.add(new_answer)
        try:
            await db.commit()
            await db.refresh(new_answer)
        except IntegrityError:
            await db.rollback()
            ex_after = await db.execute(
                select(AnswerDBModel).where(
                    AnswerDBModel.question_id == question_id,
                    AnswerDBModel.is_bot == True,
                    AnswerDBModel.is_deleted.is_(False),
                )
            )
            row = ex_after.scalar_one_or_none()
            if row:
                if row.status == "posted":
                    return {
                        "is_ok": True,
                        "created": False,
                        "answer": AnswerSchema.model_validate(row),
                    }
                was_generating = row.status == "generating"
                row.text = text
                row.status = "posted"
                await db.commit()
                await db.refresh(row)
                return {
                    "is_ok": True,
                    "created": was_generating,
                    "answer": AnswerSchema.model_validate(row),
                }
            raise
        return {
            "is_ok": True,
            "created": True,
            "answer": AnswerSchema.model_validate(new_answer),
        }
