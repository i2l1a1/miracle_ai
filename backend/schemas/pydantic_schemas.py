from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class QuestionSchema(BaseModel):
    id: Optional[int] = None
    username: str
    title: str
    text: str
    tags: Optional[List[str]] = None
    date_added: Optional[datetime] = None
    status: str = Field(default="Answered by AI")

    model_config = {"from_attributes": True}


class AnswerSchema(BaseModel):
    id: Optional[int] = None
    username: str
    text: str
    rating: int = 0
    is_bot: bool = False
    date_added: Optional[datetime] = None
    current_vote: Optional[int] = None

    model_config = {"from_attributes": True}


class AnswerCreateSchema(BaseModel):
    question_id: int
    username: str
    text: str
    rating: int = 0
    is_bot: bool = False


class VoteSchema(BaseModel):
    answer_id: int
    username: str
    vote_type: int


class UserCreateSchema(BaseModel):
    username: str
    password: str
