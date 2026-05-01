_CODE_BLOCK_RULES = """
About code (mandatory if showing code examples, terminal commands, configs, SQL, markup, etc.):
- Do not insert code "as plain text" into a paragraph. Always wrap it in a Markdown fenced block.
- Format: strictly three backticks, with the language identifier on the same line (lowercase, no spaces): python, javascript, typescript, bash, sql, json, yaml, html, css, text, etc.
- Example:
```python
def hello():
    return "world"
```
- Put an empty line (separate paragraph) before and after the block.
- If the language is not obvious, use `text`.
- Do not use indentation "like in an editor" instead of a fenced block.
""".strip()


def _normalize_fenced_code_openings(text: str) -> str:
    lines = text.splitlines()
    out: list[str] = []
    in_fence = False
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("```"):
            if not in_fence:
                lang = stripped[3:].strip()
                if not lang:
                    out.append("```text")
                else:
                    out.append(line)
                in_fence = True
            else:
                out.append(line)
                in_fence = False
        else:
            out.append(line)
    return "\n".join(out)
