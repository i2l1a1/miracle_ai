from langchain_core.messages import HumanMessage, SystemMessage
from services.generation.build_chat import _build_chat, safe_ainvoke
from services.generation.code_generation import _CODE_BLOCK_RULES, _normalize_fenced_code_openings
from services.generation.classify_question import detect_question_language
from services.generation.generation_log import log_pipeline_step


async def generate_answer_text(question_title: str, question_text: str) -> str:
    chat = _build_chat(max_tokens=4096, temperature=0.0)

    detected_language = detect_question_language(question_title, question_text)

    step1_system = SystemMessage(
        content="You are a neutral expert. Answer only based on reliable knowledge."
    )
    step1_user = HumanMessage(
        content=f"""User's question:
Title: {question_title}
Text: {question_text}

List the key facts you know about this question. If the question requires up-to-date data (news, events after your training date), honestly state: "My data is not up to date."
You MUST write the facts in {detected_language}.
Do not invent sources or make up information.

Format the output as:
Facts:
- fact 1
- fact 2
..."""
    )
    step1_messages = [step1_system, step1_user]
    step1_result = (await safe_ainvoke(chat, step1_messages)).content
    log_pipeline_step("Current", 1, "Facts", step1_result)

    step2_system = SystemMessage(
        content=(
            "You are an informative assistant. If the question requires up-to-date data (news, future, current events), honestly state the limitation of your knowledge and suggest the user check the information online. "
            f"You MUST answer in {detected_language}. "
            "Tone - neutral, honest. Plain text — no Markdown (no **, *, # headings, md lists). "
            "Exception: code and command examples — only in fenced blocks ```language ... ```, as described in the user's rules."
        )
    )
    step2_user = HumanMessage(
        content=f"""Based on the facts, write an answer to the question:
{question_title} - {question_text}

Facts:
{step1_result}

{_CODE_BLOCK_RULES}

Rules:
- You MUST answer in {detected_language}.
- If the facts indicate that the data is not up to date, say in {detected_language}: "I do not have up-to-date information because my data is limited to [date]. I recommend searching online."
- If there are enough facts and they are up to date - give a clear answer.
- Do not use Markdown for plain text.
- Break the answer into paragraphs (\\n\\n) as needed.
- Do not add made-up information.
- FORBIDDEN to add any filler phrases.

Answer:"""
    )
    step2_messages = [step2_system, step2_user]
    step2_result = (await safe_ainvoke(chat, step2_messages)).content
    log_pipeline_step("Current", 2, "Draft", step2_result)

    step3_system = SystemMessage(
        content=(
            f"You are an editor. Return only the corrected answer in {detected_language}, without comments or explanations. "
            "Plain text — no md lists, md numbering, # headings, **, or *. "
            "Code blocks between the opening ```language and closing ``` keep verbatim."
        )
    )
    step3_user = HumanMessage(
        content=f"""Check and correct the answer.

Original question: {question_title} - {question_text}
Reliable facts: {step1_result}
Generated answer: {step2_result}

{_CODE_BLOCK_RULES}

Task:
1. Ensure the answer is written in {detected_language}. If not, rewrite completely.
2. Remove any fabrications beyond the facts.
3. Remove Markdown elements from plain text. Keep code fences.
4. If a code example lacks a fenced block, wrap it in ```appropriate_language ... ```.
5. If the question requires up-to-date data and the model invented it, replace with an honest answer.
6. Remove any filler phrases.
7. Return only the corrected answer.

Corrected answer:"""
    )
    step3_messages = [step3_system, step3_user]
    step3_result = (await safe_ainvoke(chat, step3_messages)).content
    log_pipeline_step("Current", 3, "Final answer", step3_result)

    return _normalize_fenced_code_openings(step3_result)
