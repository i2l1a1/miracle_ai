from typing import List, Optional
from datetime import datetime, timezone
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
