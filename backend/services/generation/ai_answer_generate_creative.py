from langchain_core.messages import HumanMessage, SystemMessage
from services.generation.build_chat import _build_chat, safe_ainvoke
from services.generation.code_generation import _CODE_BLOCK_RULES, _normalize_fenced_code_openings


async def generate_answer_text(question_title: str, question_text: str) -> str:
    chat = _build_chat(max_tokens=4096, temperature=0.9)

    step1_system = SystemMessage(
        content="You are a creative expert. You help generate ideas, scenarios, names, designs."
    )
    step1_user = HumanMessage(
        content=f"""User's question:
Title: {question_title}
Text: {question_text}

IMPORTANT: Determine the language of the question by reading the question itself (title and text). Do not rely on the language of the instructions.
Then describe the creative task: what needs to be generated (ideas, text, name, scenario, design), what constraints exist (style, theme, volume) and what goal the user has.
If the question is not creative but falls into this category - still treat it as creative.
You MUST write the answer in the user's question language.
At the end, specify the language in which you should give the answer.

Format the output as:
Language: <language>
Creative task: <description>
Constraints: <if any>
Goal: <what the user wants>"""
    )
    step1_messages = [step1_system, step1_user]
    step1_result = (await safe_ainvoke(chat, step1_messages)).content
    print("=== [Creative] Step 1 (Creative task analysis) ===\n", step1_result, "\n")

    detected_language = "english"
    for line in step1_result.split("\n"):
        if line.lower().startswith("язык:"):
            detected_language = line.split(":", 1)[1].strip()
            break

    step2_system = SystemMessage(
        content=(
            "You are a creative consultant. Generate ideas, scenarios, names, designs. Tone - inspiring, friendly. "
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
- You MUST answer in the language: {detected_language}.
- Tone - inspiring, encouraging experimentation.
- Suggest several options (2 to 5) if appropriate.
- Do not use Markdown for plain text (**bold**, *italic*, bullet or numbered lists, headings, code blocks).
- Enumerate options with commas or in separate paragraphs, but without Markdown.
- You may use examples and analogies.
- If the user asks for something impossible or unsafe - politely refuse and explain why.
- Hallucinations in creativity are allowed but not recommended.
- FORBIDDEN to add any filler phrases like: "if you need more information, contact me", "always glad to help", "if something is unclear - just ask", "I hope this helps", "good luck" and any other polite closing phrases. The answer must be strictly to the point, without offers of further assistance.

Answer:"""
    )
    step2_messages = [step2_system, step2_user]
    step2_result = (await safe_ainvoke(chat, step2_messages)).content
    print("=== [Creative] Step 2 (Draft) ===\n", step2_result, "\n")

    step3_system = SystemMessage(
        content=(
            "You are an editor. Return only the corrected answer text, without comments or explanations. "
            "Plain text — no md lists, md numbering, # headings, **, or *. "
            "Code blocks between the opening ```language and closing ``` keep verbatim (including newlines inside the code)."
        )
    )
    step3_user = HumanMessage(
        content=f"""Check and correct the answer.

Original question: {question_title} - {question_text}
Analysis: {step1_result}
Generated answer: {step2_result}

{_CODE_BLOCK_RULES}

Task:
1. Ensure the answer is written in the language: {detected_language}. If not - rewrite completely in that language.
2. Remove any Markdown elements (** , *, `, #, -, and bullet or numbered lists) in plain text. Do not touch the content inside paired fences ``` ... ```.
3. If a code example was without a fenced block — wrap it in ```appropriate_language ... ``` according to the rules above.
4. If options are listed as a list - rewrite them as connected text or separate with paragraphs.
5. Do not remove creative ideas, even if they are unusual.
6. REMOVE ANY FILLER PHRASES: "if you need more information, contact me", "always glad to help", "if something is unclear - just ask", "I hope this helps", "good luck", "success", "contact us", "all the best" and any other polite closing phrases. The answer must end with the last useful sentence on point.
7. If everything is fine, return the answer unchanged.

Return only the corrected answer. Without explanations."""
    )
    step3_messages = [step3_system, step3_user]
    step3_result = (await safe_ainvoke(chat, step3_messages)).content
    print("=== [Creative] Step 3 (Final answer) ===\n", step3_result, "\n")

    return _normalize_fenced_code_openings(step3_result)
