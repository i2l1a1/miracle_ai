from sqlalchemy import Column, Integer, String, DateTime, JSON, Text
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
