from langchain_core.messages import HumanMessage, SystemMessage
from services.generation.build_chat import _build_chat, safe_ainvoke
from services.generation.code_generation import _CODE_BLOCK_RULES, _normalize_fenced_code_openings
from services.generation.classify_question import detect_question_language


async def generate_answer_text(question_title: str, question_text: str) -> str:
    chat = _build_chat(max_tokens=4096, temperature=0.9)

    detected_language = detect_question_language(question_title, question_text)

    step1_system = SystemMessage(
        content="You are a creative expert. You help generate ideas, scenarios, names, designs."
    )
    step1_user = HumanMessage(
        content=f"""User's question:
Title: {question_title}
Text: {question_text}

Describe the creative task: what needs to be generated (ideas, text, name, scenario, design), what constraints exist (style, theme, volume) and what goal the user has.
If the question is not creative but falls into this category - still treat it as creative.
Write the analysis in {detected_language}.

Format the output as:
Creative task: <description>
Constraints: <if any>
Goal: <what the user wants>"""
    )
    step1_messages = [step1_system, step1_user]
    step1_result = (await safe_ainvoke(chat, step1_messages)).content
    print("=== [Creative] Step 1 (Creative task analysis) ===\n", step1_result, "\n")

    step2_system = SystemMessage(
        content=(
            "You are a creative consultant. Generate ideas, scenarios, names, designs. Tone - inspiring, friendly. "
            f"You MUST answer in {detected_language}. "
            "Suggest several options (2-5) if appropriate. Plain text — no Markdown (no **, *, # headings, md lists). "
            "Exception: code and command examples — only in fenced blocks ```language ... ```, as described in the user's rules."
        )
    )
    step2_user = HumanMessage(
        content=f"""Based on the analysis, write a creative answer to the question:
{question_title} - {question_text}

Analysis:
{step1_result}

{_CODE_BLOCK_RULES}

Rules:
- You MUST answer in {detected_language}.
- Tone - inspiring, encouraging experimentation.
- Suggest several options (2 to 5) if appropriate.
- Do not use Markdown for plain text.
- Enumerate options with commas or in separate paragraphs, but without Markdown.
- You may use examples and analogies.
- If the user asks for something impossible or unsafe - politely refuse and explain why.
- Hallucinations in creativity are allowed but not recommended.
- FORBIDDEN to add any filler phrases.

Answer:"""
    )
    step2_messages = [step2_system, step2_user]
    step2_result = (await safe_ainvoke(chat, step2_messages)).content
    print("=== [Creative] Step 2 (Draft) ===\n", step2_result, "\n")

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
Analysis: {step1_result}
Generated answer: {step2_result}

{_CODE_BLOCK_RULES}

Task:
1. Ensure the answer is written in {detected_language}. If not, rewrite completely.
2. Remove any Markdown elements from plain text. Keep code fences.
3. If a code example lacks a fenced block, wrap it in ```appropriate_language ... ```.
4. If options are listed as a list, rewrite them as connected text or separate with paragraphs.
5. Do not remove creative ideas.
6. Remove any filler phrases.
7. Return only the corrected answer.

Corrected answer:"""
    )
    step3_messages = [step3_system, step3_user]
    step3_result = (await safe_ainvoke(chat, step3_messages)).content
    print("=== [Creative] Step 3 (Final answer) ===\n", step3_result, "\n")

    return _normalize_fenced_code_openings(step3_result)
