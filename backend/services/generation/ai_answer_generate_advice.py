from langchain_core.messages import HumanMessage, SystemMessage
from services.generation.build_chat import _build_chat, safe_ainvoke
from services.generation.code_generation import _CODE_BLOCK_RULES, _normalize_fenced_code_openings
from services.generation.classify_question import detect_question_language
from services.generation.generation_log import log_pipeline_step


async def generate_answer_text(question_title: str, question_text: str) -> str:
    chat = _build_chat(max_tokens=4096, temperature=0.3)

    detected_language = detect_question_language(question_title, question_text)

    step1_system = SystemMessage(
        content="You are a neutral expert. Answer only based on reliable knowledge."
    )
    step1_user = HumanMessage(
        content=f"""User's question:
Title: {question_title}
Text: {question_text}

List the key facts that will help give advice (e.g., known options, pros/cons, selection criteria).
You MUST write these facts in {detected_language}.
If you are unsure about any fact, be sure to indicate that (e.g., "I am not sure about ...").
Do not invent sources or make up information.

Format the output as:
Facts:
- fact 1
- fact 2
..."""
    )
    step1_messages = [step1_system, step1_user]
    step1_result = (await safe_ainvoke(chat, step1_messages)).content
    log_pipeline_step("Advice", 1, "Facts", step1_result)

    step2_system = SystemMessage(
        content=(
            "You are an experienced consultant on a forum. Give balanced advice, list options, their pros and cons. "
            f"You MUST answer in {detected_language}. "
            "Tone - neutral, friendly. Plain text — no Markdown (no **, *, # headings, md lists). "
            "Exception: code and command examples — only in fenced blocks ```language ... ```, as described in the user's rules."
        )
    )
    step2_user = HumanMessage(
        content=f"""Based on the facts, write an advice answer to the question:
{question_title} - {question_text}

Facts:
{step1_result}

{_CODE_BLOCK_RULES}

Rules:
- You MUST answer in {detected_language}.
- Tone - neutral, friendly, without pressure.
- Suggest several options (if appropriate), indicate their pros and cons.
- Do not use Markdown for plain text: **bold**, *italic*, # headings, bullet or numbered lists in md syntax.
- Instead of lists, write in connected text, enumerating options with commas or separating them with paragraphs.
- If there are not enough facts, say in {detected_language}: "I don't have enough information to give accurate advice. Please clarify."
- Do not add made-up information.
- FORBIDDEN to add any filler phrases.

Answer:"""
    )
    step2_messages = [step2_system, step2_user]
    step2_result = (await safe_ainvoke(chat, step2_messages)).content
    log_pipeline_step("Advice", 2, "Draft", step2_result)

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
3. In plain text, remove Markdown elements: **, *, #, bullet/numbered lists, single `. Keep code fences.
4. If a code example lacks a fenced block, wrap it in ```appropriate_language ... ```.
5. If options are listed in prose, they should be connected text, not markdown.
6. Remove any filler phrases.
7. Return only the corrected answer.

Corrected answer:"""
    )
    step3_messages = [step3_system, step3_user]
    step3_result = (await safe_ainvoke(chat, step3_messages)).content
    log_pipeline_step("Advice", 3, "Final answer", step3_result)

    return _normalize_fenced_code_openings(step3_result)
