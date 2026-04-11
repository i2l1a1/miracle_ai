from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey, Index, UniqueConstraint
from sqlalchemy.sql import text as sql_text
from database.data_base_init import Base
from datetime import datetime, timezone
from sqlalchemy.orm import relationship


class QuestionTagDBModel(Base):
    __tablename__ = "question_tags"

    question_id = Column(
        Integer,
        ForeignKey("questions.id", ondelete="CASCADE"),
        primary_key=True,
    )
    tag = Column(Text, primary_key=True)

    question = relationship("QuestionDBModel", back_populates="tag_rows")


class QuestionDBModel(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    username = Column(String, index=True, nullable=False)
    title = Column(String, nullable=False)
    text = Column(Text, nullable=False)
    date_added = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    status = Column(String(40), default="Answered by AI", nullable=False)
    answers_count = Column(Integer, default=0, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)

    tag_rows = relationship(
        "QuestionTagDBModel",
        back_populates="question",
        cascade="all, delete-orphan",
        order_by=QuestionTagDBModel.tag,
    )

    @property
    def tags(self) -> list[str]:
        return [r.tag for r in self.tag_rows]


class AnswerDBModel(Base):
    __tablename__ = "answers"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(
        Integer,
        ForeignKey("questions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    username = Column(String, nullable=False)
    text = Column(Text, nullable=False)
    rating = Column(Integer, default=0, nullable=False)
    is_bot = Column(Boolean, default=False, nullable=False)
    date_added = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    is_deleted = Column(Boolean, default=False, nullable=False)
    status = Column(String(32), default="posted", nullable=False)

    __table_args__ = (
        Index(
            "uq_answers_one_bot_per_question",
            "question_id",
            unique=True,
            postgresql_where=sql_text("is_bot = true AND is_deleted = false"),
        ),
    )


class VoteDBModel(Base):
    __tablename__ = "votes"

    id = Column(Integer, primary_key=True, index=True)
    answer_id = Column(
        Integer,
        ForeignKey("answers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    vote_type = Column(Integer, nullable=False)

    __table_args__ = (
        UniqueConstraint("answer_id", "user_id", name="uq_vote_answer_user"),
    )


class RefreshTokenDBModel(Base):
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    token = Column(String, unique=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    revoked_at = Column(DateTime(timezone=True), nullable=True)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    questions_count = Column(Integer, default=0, nullable=False)
    answers_count = Column(Integer, default=0, nullable=False)
    language = Column(String(5), default="en", nullable=False)
    status = Column(String(10), default="ACTIVE", nullable=False)
