from sqlalchemy import Column, Integer, String, DateTime, JSON, Text, Boolean, ForeignKey, UniqueConstraint
from database.data_base_init import Base
from datetime import datetime, timezone


class QuestionDBModel(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, index=True, nullable=False)
    title = Column(String, nullable=False)
    text = Column(Text, nullable=False)
    tags = Column(JSON, nullable=True)
    date_added = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    status = Column(String(40), default="Answered by AI", nullable=False)


class AnswerDBModel(Base):
    __tablename__ = "answers"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(
        Integer,
        ForeignKey("questions.id", ondelete="CASCADE"),
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
        nullable=False
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
    username = Column(String, nullable=False, index=True)
    vote_type = Column(Integer, nullable=False)

    __table_args__ = (UniqueConstraint("answer_id", "username", name="uq_vote_answer_username"),)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
