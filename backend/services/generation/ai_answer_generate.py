import os

from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI

load_dotenv(dotenv_path=".env")


def _build_chat() -> ChatOpenAI:
    return ChatOpenAI(
        base_url=os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"),
        api_key=os.getenv("OPENROUTER_API_KEY"),
        model=os.getenv("OPENROUTER_MODEL", "arcee-ai/trinity-mini:free"),
        extra_body={"reasoning": {"enabled": True}},
    )


def generate_answer_text(question_title: str, question_text: str) -> str:
    chat = _build_chat()

    step1_system = SystemMessage(
        content="Ты – нейтральный помощник, который отвечает только на основе достоверных знаний."
    )
    step1_user = HumanMessage(
        content=f"""Вопрос пользователя:
Заголовок: {question_title}
Текст: {question_text}

Сначала определи язык вопроса (например, русский, английский, немецкий и т.д.).
Затем оцени тон вопроса (дружелюбный, серьёзный, нейтральный, раздражённый и т.п.).
После этого перечисли ключевые факты, которые ты знаешь по этому вопросу, в виде простого списка.
Если ты не уверен в каком-то факте, обязательно укажи это (например: «Я не уверен в ...»).
Не придумывай источники и не выдумывай информацию.
В конце укажи язык, на котором нужно дать ответ.

Вывод оформи в формате:
Язык: <язык>
Тон: <тон>
Факты:
- факт 1
- факт 2
..."""
    )
    step1_messages = [step1_system, step1_user]
    step1_result = chat.invoke(step1_messages).content
    print("=== Шаг 1 (Факты, язык, тон) ===\n", step1_result, "\n")

    step2_system = SystemMessage(
        content="Ты – участник форума, который отвечает на вопросы дружелюбно и по делу. Стиль как на Reddit или Stack Overflow – разговорный, но содержательный."
    )
    step2_user = HumanMessage(
        content=f"""На основе следующих фактов (полученных на предыдущем шаге) напиши ответ на вопрос:
{question_title} – {question_text}

Факты, язык и тон:
{step1_result}

Правила:
- Используй язык, указанный в фактах.
- Учитывай тон вопроса и подстраивай ответ соответствующим образом: если тон дружелюбный, ответ должен быть дружелюбным; если серьёзный – строгим и по делу.
- Не используй маркдаун: никаких **жирный текст**, *курсив*, списки (маркированные или нумерованные), заголовков #, блоков кода и т.п.
- Разбивай ответ на логические параграфы, разделяя их пустой строкой (\\n\\n).
- Если фактов недостаточно, честно скажи «Я не знаю ответа на этот вопрос».
- Не добавляй от себя вымышленную информацию.

Ответ:"""
    )
    step2_messages = [step2_system, step2_user]
    step2_result = chat.invoke(step2_messages).content
    print("=== Шаг 2 (Черновик ответа) ===\n", step2_result, "\n")

    step3_system = SystemMessage(
        content="Ты – редактор. Возвращай только исправленный текст ответа, без каких-либо комментариев, пояснений, списков, нумерации, заголовков или других служебных элементов."
    )
    step3_user = HumanMessage(
        content=f"""Проверь и при необходимости исправь ответ.

У тебя есть:
- исходный вопрос: {question_title} – {question_text}
- список достоверных фактов: {step1_result}
- сгенерированный ответ: {step2_result}

Задача:
1. Убедись, что ответ написан на том же языке, что и факты.
2. Проверь, что ответ не содержит выдуманных утверждений, выходящих за рамки фактов. Если обнаружил галлюцинацию – исправь или удали её.
3. Удали любые элементы маркдауна: **, *, `, #, -, списки и т.п. Оставь только обычный текст, разделённый на параграфы (\\n\\n). Параграфы должны соответствовать логическому разделению текста.
4. Если всё хорошо, верни ответ без изменений.

Верни только исправленный ответ. Не добавляй никаких пояснений, комментариев или нумерации."""
    )
    step3_messages = [step3_system, step3_user]
    step3_result = chat.invoke(step3_messages).content
    print("=== Шаг 3 (Финальный ответ) ===\n", step3_result, "\n")

    return step3_result
