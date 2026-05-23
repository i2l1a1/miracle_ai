import os
from pathlib import Path

import pytest

from parsing.stackoverflow_publisher import StackOverflowPublisher


@pytest.mark.asyncio
async def test_classify_question_normalizes_invalid_llm_response(monkeypatch):
    class FakeResponse:
        content = "not json {technical"

    class FakeChat:
        async def ainvoke(self, messages):
            return FakeResponse()

    monkeypatch.setattr(
        "services.generation.classify_question._build_chat",
        lambda **kwargs: FakeChat(),
    )

    from services.generation.classify_question import classify_question

    result = await classify_question("Title", "Body")
    assert result["type"] == "technical"
    assert 0.0 <= result["confidence"] <= 1.0


def test_html_to_text_paragraph_and_fenced_code():
    env_path = Path(__file__).resolve().parents[1] / ".env"
    os.environ.setdefault("USERNAME_FOR_PARSING", "u")
    os.environ.setdefault("PASSWORD_FOR_PARSING", "p")
    publisher = StackOverflowPublisher("http://localhost:8080", env_path=str(env_path))
    publisher._current_tags = ["python"]
    html = (
        "<p>Hello <code>inline</code> world.</p>"
        "<pre><code>print('hi')</code></pre>"
    )
    text = publisher.html_to_text(html)
    assert "Hello `inline` world." in text
    assert "```python" in text
    assert "print('hi')" in text
