import json
import sys
import re
import os
import requests
from typing import Any
from datetime import datetime, timezone
from dotenv import load_dotenv
from bs4 import BeautifulSoup, NavigableString, Tag
from html import unescape
from pygments.lexers import guess_lexer
from pygments.util import ClassNotFound
from concurrent.futures import ThreadPoolExecutor, as_completed


class StackOverflowPublisher:

    def __init__(self, api_url: str, env_path: str = "../.env"):
        load_dotenv(dotenv_path=env_path)

        self.api_url = api_url
        self.username = os.getenv("USERNAME_FOR_PARSING")
        self.password = os.getenv("PASSWORD_FOR_PARSING")

        if not self.username or not self.password:
            raise RuntimeError("Missing env credentials")

    def ensure_ok(self, response: requests.Response, action: str) -> dict[str, Any]:
        try:
            data = response.json()
        except json.JSONDecodeError:
            raise RuntimeError(f"{action} failed: non-JSON response ({response.status_code})")

        if not response.ok:
            raise RuntimeError(f"{action} failed ({response.status_code}): {data}")

        return data

    def login(self, session: requests.Session) -> None:
        r = session.post(
            f"{self.api_url.rstrip('/')}/token",
            data={"username": self.username, "password": self.password},
            timeout=30,
        )

        if not r.ok:
            raise RuntimeError(f"Login failed: {r.text}")

    def create_question(
            self,
            session: requests.Session,
            title: str,
            text: str,
            tags: list[str],
    ) -> int:

        payload = {
            "id": None,
            "user_id": 0,
            "username": self.username,
            "title": title.strip(),
            "text": text.strip(),
            "tags": tags,
        }

        r = session.post(
            f"{self.api_url.rstrip('/')}/add_new_question",
            json=payload,
            timeout=30,
        )

        data = self.ensure_ok(r, "Create question")

        if not data.get("is_ok"):
            raise RuntimeError(f"Create question failed: {data}")

        qid = data.get("id")
        if not isinstance(qid, int):
            raise RuntimeError(f"Missing question id: {data}")

        return qid

    def trigger_ai_generation(
            self,
            cookies: requests.cookies.RequestsCookieJar,
            question_id: int,
    ) -> dict[str, Any]:
        session = requests.Session()
        session.cookies.update(cookies)
        r = session.post(
            f"{self.api_url.rstrip('/')}/generate_ai_answer/{question_id}",
            timeout=300,
        )
        data = self.ensure_ok(r, f"Generate AI answer for question {question_id}")
        if not data.get("is_ok"):
            raise RuntimeError(f"Generate AI answer failed for {question_id}: {data}")
        return data

    def fetch_questions(self, fromdate: datetime, todate: datetime) -> list[dict]:
        url = "https://api.stackexchange.com/2.3/questions"

        def to_unix(dt: datetime) -> int:
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return int(dt.astimezone(timezone.utc).timestamp())

        params = {
            "order": "desc",
            "sort": "creation",
            "site": "stackoverflow",
            "filter": "withbody",
            "answers": 0,
            "fromdate": to_unix(fromdate),
            "todate": to_unix(todate),
            "pagesize": 100,
        }

        r = requests.get(url, params=params, timeout=30)
        data = r.json()

        if not r.ok:
            raise RuntimeError(f"StackExchange API error: {data}")

        return data.get("items", [])

    def detect_code_language(self, code: str) -> str:
        tags = getattr(self, '_current_tags', None)
        if tags:
            lang = self._lang_from_tags(tags)
            if lang:
                return lang

        try:
            lexer = guess_lexer(code)
            return lexer.aliases[0] if lexer.aliases else ""
        except ClassNotFound:
            return ""

    def _lang_from_tags(self, tags: list[str]) -> str:
        tag_lang_map = {
            "python": "python", "python3": "python", "py": "python",
            "javascript": "javascript", "js": "javascript",
            "java": "java", "c": "c", "cpp": "cpp", "c++": "cpp",
            "csharp": "csharp", "c#": "csharp", "dotnet": "csharp",
            "ruby": "ruby", "go": "go", "golang": "go", "rust": "rust",
            "php": "php", "swift": "swift", "kotlin": "kotlin",
            "typescript": "typescript", "ts": "typescript",
            "html": "html", "css": "css", "sql": "sql", "bash": "bash",
            "shell": "bash", "powershell": "powershell", "perl": "perl",
            "lua": "lua", "r": "r", "matlab": "matlab", "dart": "dart",
            "elixir": "elixir", "erlang": "erlang", "haskell": "haskell",
            "clojure": "clojure", "scala": "scala", "groovy": "groovy",
            "objectivec": "objective-c", "swift": "swift",
        }
        for tag in tags:
            tag_norm = tag.lower().strip()
            if tag_norm in tag_lang_map:
                return tag_lang_map[tag_norm]
            parts = re.split(r'[-._]', tag_norm)
            for part in parts:
                if part in tag_lang_map:
                    return tag_lang_map[part]
        return ""

    def normalize_text(self, text: str) -> str:
        text = re.sub(r"\n{3,}", "\n\n", text)
        text = re.sub(r"[ \t]+\n", "\n", text)
        text = re.sub(r"\n[ \t]+", "\n", text)
        return text.strip()

    def render_inline(self, node: Tag) -> str:
        parts = []

        for child in node.children:
            if isinstance(child, NavigableString):
                parts.append(str(child))

            elif isinstance(child, Tag):
                if child.name == "code" and child.find_parent("pre") is None:
                    parts.append(f"`{child.get_text(strip=True)}`")
                elif child.name == "br":
                    parts.append("\n")
                else:
                    parts.append(self.render_inline(child))

        text = unescape("".join(parts))
        return self.normalize_text(text)

    def render_code_block(self, pre_tag: Tag) -> str:
        code_tag = pre_tag.find("code")
        code = code_tag.get_text() if code_tag else pre_tag.get_text()
        code = unescape(code)

        lang = self.detect_code_language(code.strip())

        if lang:
            return f"```{lang}\n{code}```"
        return f"```\n{code}```"

    def render_list(self, list_tag: Tag) -> list[str]:
        lines = []
        ordered = list_tag.name == "ol"

        li_items = list_tag.find_all("li", recursive=False)

        for idx, li in enumerate(li_items, start=1):
            item_parts = []

            for child in li.children:
                if isinstance(child, NavigableString):
                    text = self.normalize_text(unescape(str(child)))
                    if text:
                        item_parts.append(text)

                elif isinstance(child, Tag):
                    if child.name == "p":
                        text = self.render_inline(child)
                        if text:
                            item_parts.append(text)

                    elif child.name == "pre":
                        item_parts.append(self.render_code_block(child))

                    elif child.name in ("ul", "ol"):
                        item_parts.append("\n".join(self.render_list(child)))

                    else:
                        text = self.render_inline(child)
                        if text:
                            item_parts.append(text)

            item_text = "\n".join(p for p in item_parts if p.strip())
            item_text = self.normalize_text(item_text)

            prefix = f"{idx}." if ordered else "-"
            if item_text:
                lines.append(f"{prefix} {item_text}")

        return lines

    def html_to_text(self, html: str) -> str:
        soup = BeautifulSoup(html, "html.parser")
        result = []

        for node in soup.contents:
            if isinstance(node, NavigableString):
                text = self.normalize_text(unescape(str(node)))
                if text:
                    result.append(text)
                continue

            if not isinstance(node, Tag):
                continue

            if node.name == "p":
                text = self.render_inline(node)
                if text:
                    result.append(text)

            elif node.name in ("ul", "ol"):
                result.extend(self.render_list(node))

            elif node.name == "pre":
                result.append(self.render_code_block(node))

            else:
                text = self.render_inline(node)
                if text:
                    result.append(text)

        return "\n\n".join(result).strip()

    def publish_questions_in_range(
            self,
            fromdate: datetime,
            todate: datetime,
            start_generation: bool = True,
            generation_workers: int = 8,
    ) -> None:

        session = requests.Session()
        self.login(session)

        questions = self.fetch_questions(fromdate, todate)
        created_ids: list[int] = []

        print(f"Fetched {len(questions)} questions")

        for q in questions:
            title = q.get("title", "")
            body = self.html_to_text(q.get("body", ""))
            tags = q.get("tags", [])

            try:
                qid = self.create_question(
                    session=session,
                    title=title,
                    text=body,
                    tags=tags,
                )
                created_ids.append(qid)
                print(f"Published: {qid} | {title}")

            except Exception as e:
                print(f"FAILED: {title} -> {e}", file=sys.stderr)

        if not start_generation or not created_ids:
            return

        cookies = session.cookies.copy()
        workers = max(1, generation_workers)
        with ThreadPoolExecutor(max_workers=workers) as executor:
            futures = {
                executor.submit(self.trigger_ai_generation, cookies, qid): qid
                for qid in created_ids
            }
            for future in as_completed(futures):
                qid = futures[future]
                try:
                    future.result()
                    print(f"AI generation started/completed for question: {qid}")
                except Exception as e:
                    print(f"FAILED GENERATION: {qid} -> {e}", file=sys.stderr)
