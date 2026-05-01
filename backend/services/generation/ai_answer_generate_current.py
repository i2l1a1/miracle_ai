from langchain_core.messages import HumanMessage, SystemMessage
from services.generation.build_chat import _build_chat, safe_ainvoke
from services.generation.code_generation import _CODE_BLOCK_RULES, _normalize_fenced_code_openings


async def generate_answer_text(question_title: str, question_text: str) -> str:
    chat = _build_chat(max_tokens=4096, temperature=0.0)

    step1_system = SystemMessage(
        content="You are a neutral expert. Answer only based on reliable knowledge."
    )
    step1_user = HumanMessage(
        content=f"""User's question:
Title: {question_title}
Text: {question_text}

IMPORTANT: Determine the language of the question by reading the question itself (title and text). Do not rely on the language of the instructions.
Then list the key facts you know about this question. If the question requires up-to-date data (news, events after your training date), honestly state: "My data is not up to date." You MUST write the facts in the user's question language.
Do not invent sources or make up information.
At the end, specify the language in which you should give the answer.

Format the output as:
Language: <language>
Facts:
- fact 1
- fact 2
..."""
    )
    step1_messages = [step1_system, step1_user]
    step1_result = (await safe_ainvoke(chat, step1_messages)).content
    print("=== [Current] Step 1 (Facts and language) ===\n", step1_result, "\n")

    detected_language = "english"
    for line in step1_result.split("\n"):
        if line.lower().startswith("язык:"):
            detected_language = line.split(":", 1)[1].strip()
            break

    step2_system = SystemMessage(
        content=(
            "You are an informative assistant. If the question requires up-to-date data (news, future, current events), honestly state the limitation of your knowledge and suggest the user check the information online. "
            "Tone - neutral, honest. Plain text — no Markdown (no **, *, # headings, md lists). "
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
- You MUST answer in the language: {detected_language}.
- If the facts indicate that the data is not up to date, say something like: "I do not have up-to-date information because my data is limited to [date]. I recommend searching online" (in the language {detected_language}).
- If there are enough facts and they are up to date - give a clear answer.
- Do not use Markdown for plain text (**bold**, *italic*, lists, headings, code blocks).
- Break the answer into paragraphs (\\n\\n) as needed.
- Do not add made-up information.
- FORBIDDEN to add any filler phrases like: "if you need more information, contact me", "always glad to help", "if something is unclear - just ask", "I hope this helps", "good luck" and any other polite closing phrases. The answer must be strictly to the point, without offers of further assistance.

Answer:"""
    )
    step2_messages = [step2_system, step2_user]
    step2_result = (await safe_ainvoke(chat, step2_messages)).content
    print("=== [Current] Step 2 (Draft) ===\n", step2_result, "\n")

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
1. Ensure the answer is written in the language: {detected_language}. If not - rewrite completely in that language.
2. Remove any fabrications that go beyond the facts.
3. Remove Markdown elements (** , *, `, #, -, lists) in plain text. Do not touch the content inside paired fences ``` ... ```.
4. If a code example was without a fenced block — wrap it in ```appropriate_language ... ``` according to the rules above.
5. If the question requires up-to-date data and the model tried to invent it - replace with an honest answer of not knowing.
6. REMOVE ANY FILLER PHRASES: "if you need more information, contact me", "always glad to help", "if something is unclear - just ask", "I hope this helps", "good luck", "success", "contact us", "all the best" and any other polite closing phrases. The answer must end with the last useful sentence on point.
7. If everything is fine, return the answer unchanged.

Return only the corrected answer. Without explanations."""
    )
    step3_messages = [step3_system, step3_user]
    step3_result = (await safe_ainvoke(chat, step3_messages)).content
    print("=== [Current] Step 3 (Final answer) ===\n", step3_result, "\n")

    return _normalize_fenced_code_openings(step3_result)
