from langchain_core.messages import HumanMessage, SystemMessage
from services.generation.build_chat import _build_chat, safe_ainvoke
from services.generation.code_generation import _CODE_BLOCK_RULES, _normalize_fenced_code_openings


async def generate_answer_text(question_title: str, question_text: str) -> str:
    chat = _build_chat(max_tokens=4096, temperature=0.0)

    step1_system = SystemMessage(
        content="You are a neutral technical expert. Answer only based on reliable knowledge."
    )
    step1_user = HumanMessage(
        content=f"""User's question:
Title: {question_title}
Text: {question_text}

IMPORTANT: Determine the language of the question by reading the question itself (title and text). Do not rely on the language of the instructions.
Then list the key facts needed to answer as a simple list. You MUST write the facts in the user's question language.
If you are unsure about any fact, be sure to indicate that (e.g., "I am not sure about ...").
Do not invent sources or make up information.
At the end, specify the language in which you should give the answer (the one you determined from the question).

Format the output as:
Language: <language>
Facts:
- fact 1
- fact 2
..."""
    )
    step1_messages = [step1_system, step1_user]
    step1_result = (await safe_ainvoke(chat, step1_messages)).content
    print("=== [Technical] Step 1 (Facts and language) ===\n", step1_result, "\n")

    detected_language = "english"
    for line in step1_result.split("\n"):
        if line.lower().startswith("язык:"):
            detected_language = line.split(":", 1)[1].strip()
            break

    step2_system = SystemMessage(
        content=(
            "You are a technical forum participant. Answer briefly, precisely, to the point. Tone - neutral, strict. "
            "Plain text — no Markdown (no **, *, # headings, md lists). "
            "Exception: code and command examples — only in fenced blocks ```language ... ```, as described in the user's rules."
        )
    )
    step2_user = HumanMessage(
        content=f"""Based on the facts, write an answer to the question:
{question_title} - {question_text}

Facts and language:
{step1_result}

{_CODE_BLOCK_RULES}

Rules:
- You MUST answer in the language: {detected_language}. This is the most important point.
- Tone - neutral, strict.
- Do not use Markdown for plain text (**bold**, *italic*, lists, headings, code blocks).
- Break the answer into paragraphs (\\n\\n) only if necessary for logic.
- If there are not enough facts, honestly say "I don't know the answer to this question" (in the language {detected_language}).
- Do not add made-up information.
- FORBIDDEN to add any filler phrases like: "if you need more information, contact me", "always glad to help", "if something is unclear - just ask", "I hope this helps", "good luck" and any other polite closing phrases. The answer must be strictly to the point, without offers of further assistance.

Answer:"""
    )
    step2_messages = [step2_system, step2_user]
    step2_result = (await safe_ainvoke(chat, step2_messages)).content
    print("=== [Technical] Step 2 (Draft) ===\n", step2_result, "\n")

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
Reliable facts: {step1_result}
Generated answer: {step2_result}

{_CODE_BLOCK_RULES}

Task:
1. Ensure the answer is written in the language: {detected_language}. If not - rewrite completely in that language, preserving the content.
2. Remove any fabrications that go beyond the facts.
3. Remove Markdown elements (** , *, `, #, -, lists) in plain text. Do not touch the content inside paired fences ``` ... ```.
4. If a code example was without a fenced block — wrap it in ```appropriate_language ... ``` according to the rules above.
5. REMOVE ANY FILLER PHRASES: "if you need more information, contact me", "always glad to help", "if something is unclear - just ask", "I hope this helps", "good luck", "success", "contact us", "all the best" and any other polite closing phrases. The answer must end with the last useful sentence on point.
6. If everything is fine, return the answer unchanged.

Return only the corrected answer. Without explanations."""
    )
    step3_messages = [step3_system, step3_user]
    step3_result = (await safe_ainvoke(chat, step3_messages)).content
    print("=== [Technical] Step 3 (Final answer) ===\n", step3_result, "\n")

    return _normalize_fenced_code_openings(step3_result)
