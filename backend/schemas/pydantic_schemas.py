from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class QuestionSchema(BaseModel):
    id: Optional[int] = None
    user_id: int
    username: str
    title: str
    text: str
    tags: Optional[List[str]] = None
    date_added: Optional[datetime] = None
    status: str = Field(default="Answered by AI")
    answers_count: int = Field(default=0)

    model_config = {"from_attributes": True}


class AnswerSchema(BaseModel):
    id: Optional[int] = None
    user_id: int
    username: str
    text: str
    rating: int = 0
    is_bot: bool = False
    date_added: Optional[datetime] = None
    current_vote: Optional[int] = None
    status: str = "posted"

    model_config = {"from_attributes": True}


class AnswerWithQuestionSchema(AnswerSchema):
    question_id: int = 0
    question_title: str = ""


class AnswerCreateSchema(BaseModel):
    question_id: int
    user_id: int
    username: str
    text: str
    is_bot: bool = False


class VoteSchema(BaseModel):
    answer_id: int
    user_id: int
    vote_type: int


class UserCreateSchema(BaseModel):
    username: str
    password: str


class UserUpdateSchema(BaseModel):
    username: str
    language: str


class TokenRefreshRequest(BaseModel):
    refresh_token: str
