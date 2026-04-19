_CODE_BLOCK_RULES = """
Про код (обязательно, если показываешь примеры кода, команды терминала, конфиги, SQL, разметку и т.п.):
- Не вставляй код «просто текстом» в абзац. Всегда оборачивай в fenced-блок Markdown.
- Формат строго три обратные кавычки, на той же строке — идентификатор языка (нижний регистр, без пробелов): python, javascript, typescript, bash, sql, json, yaml, html, css, text и т.д.
- Пример:
```python
def hello():
    return "world"
```
- Перед блоком и после него — пустая строка (отдельный абзац).
- Если язык неочевиден, используй `text`.
- Не используй отступы «как в редакторе» вместо fenced-блока.
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
