import json
import os
import re
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs, quote_plus, urlparse
from urllib.request import Request, urlopen


HOST = "127.0.0.1"
PORT = 8787


def json_response(handler, code, payload):
  raw = json.dumps(payload).encode("utf-8")
  handler.send_response(code)
  handler.send_header("Content-Type", "application/json; charset=utf-8")
  handler.send_header("Content-Length", str(len(raw)))
  handler.send_header("Access-Control-Allow-Origin", "*")
  handler.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  handler.send_header("Access-Control-Allow-Headers", "Content-Type")
  handler.end_headers()
  handler.wfile.write(raw)


def youtube_search(query):
  key = os.getenv("YOUTUBE_API_KEY", "").strip()
  if not key:
    raise RuntimeError("Missing YOUTUBE_API_KEY")
  url = (
    "https://www.googleapis.com/youtube/v3/search"
    f"?part=snippet&type=video&maxResults=8&q={quote_plus(query)}&key={quote_plus(key)}"
  )
  with urlopen(url, timeout=12) as resp:
    return json.loads(resp.read().decode("utf-8"))


def openlibrary_search(query):
  url = f"https://openlibrary.org/search.json?q={quote_plus(query)}&limit=5"
  with urlopen(url, timeout=12) as resp:
    return json.loads(resp.read().decode("utf-8"))


def gemini_chat(question, model, context=""):
  key = os.getenv("GEMINI_API_KEY", "").strip()
  if not key:
    raise RuntimeError("Missing GEMINI_API_KEY")
  model_name = (model or "").strip() or "gemini-1.5-flash"
  endpoint = (
    f"https://generativelanguage.googleapis.com/v1beta/models/"
    f"{quote_plus(model_name)}:generateContent?key={quote_plus(key)}"
  )
  system_prompt = """
You are a student tutor assistant, not an assignment-completion engine.
Rules:
- Do NOT produce final essays, reports, discussion posts, or full assignment answers.
- If user asks for completion/submission-ready content, refuse briefly and switch to coaching.
- Help with understanding, structuring notes, concept breakdowns, and study plans.
- Recommend reading material and what sections/chapters to review.
- Keep output concise and practical.

Return ONLY strict JSON (no markdown) using this schema:
{
  "answer": "short tutoring response",
  "concepts": ["concept 1", "concept 2"],
  "steps": ["step 1", "step 2"],
  "materials": [
    {
      "title": "resource/book/article",
      "why": "why useful",
      "sections": "what sections to read",
      "link": "optional URL or empty string"
    }
  ],
  "policy_note": "brief reminder to submit own work"
}
"""

  payload = {
    "contents": [
      {
        "parts": [
          {"text": system_prompt},
          {"text": f"Student question: {question}"},
          {"text": f"Student notes/context (may be empty): {context}"}
        ]
      }
    ],
    "generationConfig": {"temperature": 0.35},
  }
  req = Request(
    endpoint,
    data=json.dumps(payload).encode("utf-8"),
    headers={"Content-Type": "application/json"},
    method="POST",
  )
  with urlopen(req, timeout=15) as resp:
    data = json.loads(resp.read().decode("utf-8"))
  text = ""
  try:
    text = data["candidates"][0]["content"]["parts"][0]["text"]
  except Exception:
    text = ""
  return {"text": text, "raw": data}


def parse_structured_response(raw_text):
  text = (raw_text or "").strip()
  if not text:
    return {
      "answer": "I can help you study this topic step by step.",
      "concepts": [],
      "steps": [],
      "materials": [],
      "policy_note": "Use this guidance to write your own final work."
    }

  # Try strict JSON first.
  try:
    payload = json.loads(text)
    if isinstance(payload, dict):
      return payload
  except Exception:
    pass

  # Fallback: extract first JSON object blob if model wrapped text.
  start = text.find("{")
  end = text.rfind("}")
  if start != -1 and end != -1 and end > start:
    blob = text[start:end + 1]
    try:
      payload = json.loads(blob)
      if isinstance(payload, dict):
        return payload
    except Exception:
      pass

  return {
    "answer": text,
    "concepts": [],
    "steps": [],
    "materials": [],
    "policy_note": "Use this guidance to build your own submission."
  }


def is_assignment_completion_request(question):
  q = (question or "").lower()
  patterns = [
    r"\bwrite my\b",
    r"\bdo my\b",
    r"\bcomplete my\b",
    r"\bfinish my\b",
    r"\bsubmit\b",
    r"\bfinal essay\b",
    r"\bfull essay\b",
    r"\bdiscussion post\b",
    r"\banswer all\b",
    r"\bhomework answer\b",
  ]
  return any(re.search(p, q) for p in patterns)


def _safe_string(value):
  if value is None:
    return ""
  return str(value).strip()


def gather_agentic_materials(question):
  materials = []

  # 1) Pull book candidates from OpenLibrary.
  try:
    books = openlibrary_search(question)
    docs = books.get("docs", []) if isinstance(books, dict) else []
    for doc in docs[:3]:
      title = _safe_string(doc.get("title")) or "Book suggestion"
      author = ""
      if isinstance(doc.get("author_name"), list) and doc.get("author_name"):
        author = _safe_string(doc["author_name"][0])
      year = _safe_string(doc.get("first_publish_year"))
      subtitle_parts = [p for p in [author, year] if p]
      why = "Found from topic keyword match in OpenLibrary."
      if subtitle_parts:
        why = f"{' | '.join(subtitle_parts)}. {why}"
      materials.append({
        "title": title,
        "why": why,
        "sections": "Start with table of contents, chapter summaries, and glossary/index entries for your topic.",
        "link": f"https://openlibrary.org/search?q={quote_plus(title)}"
      })
  except Exception:
    pass

  # 2) Pull video candidates from YouTube API if key exists.
  try:
    yt = youtube_search(question)
    items = yt.get("items", []) if isinstance(yt, dict) else []
    for item in items[:3]:
      snippet = item.get("snippet", {}) if isinstance(item, dict) else {}
      video_id = ""
      if isinstance(item.get("id"), dict):
        video_id = _safe_string(item["id"].get("videoId"))
      if not video_id:
        continue
      title = _safe_string(snippet.get("title")) or "Video lesson"
      channel = _safe_string(snippet.get("channelTitle"))
      materials.append({
        "title": f"{title} (video)",
        "why": f"Channel: {channel}" if channel else "Video walkthrough for the topic.",
        "sections": "Watch intro and worked examples; pause to write 3 key takeaways.",
        "link": f"https://www.youtube.com/watch?v={video_id}"
      })
  except Exception:
    pass

  return materials


class Handler(BaseHTTPRequestHandler):
  def do_OPTIONS(self):
    json_response(self, 200, {"ok": True})

  def do_GET(self):
    parsed = urlparse(self.path)
    if parsed.path == "/health":
      json_response(self, 200, {"ok": True, "youtube_key": bool(os.getenv("YOUTUBE_API_KEY")), "gemini_key": bool(os.getenv("GEMINI_API_KEY"))})
      return

    if parsed.path == "/youtube_search":
      params = parse_qs(parsed.query)
      query = (params.get("q", [""])[0] or "").strip()
      if not query:
        json_response(self, 400, {"error": "Missing q"})
        return
      try:
        data = youtube_search(query)
        json_response(self, 200, data)
      except Exception as exc:
        json_response(self, 500, {"error": str(exc)})
      return

    json_response(self, 404, {"error": "Not found"})

  def do_POST(self):
    parsed = urlparse(self.path)
    if parsed.path != "/ai_chat":
      json_response(self, 404, {"error": "Not found"})
      return

    length = int(self.headers.get("Content-Length", "0"))
    body = self.rfile.read(length).decode("utf-8") if length > 0 else "{}"
    try:
      payload = json.loads(body)
    except Exception:
      payload = {}

    question = str(payload.get("question", "")).strip()
    context = str(payload.get("context", "")).strip()
    model = str(payload.get("model", "")).strip()
    if not question:
      json_response(self, 400, {"error": "Missing question"})
      return

    try:
      if is_assignment_completion_request(question):
        json_response(self, 200, {
          "answer": "I can’t complete assignments for submission, but I can help you build your own answer.",
          "concepts": ["Understand the prompt", "Gather evidence", "Explain in your own words"],
          "steps": [
            "Paste the assignment prompt and grading rubric.",
            "I will break it into an outline you can write from.",
            "Draft each section yourself and I will give feedback."
          ],
          "materials": [],
          "policy_note": "Academic integrity: use AI for coaching, not submission-ready work."
        })
        return

      data = gemini_chat(question, model, context=context)
      structured = parse_structured_response(data.get("text", ""))
      model_materials = structured.get("materials", []) if isinstance(structured.get("materials", []), list) else []
      agent_materials = gather_agentic_materials(question)

      # Merge model suggestions + live fetched resources.
      merged_materials = []
      for item in model_materials + agent_materials:
        if not isinstance(item, dict):
          continue
        merged_materials.append({
          "title": _safe_string(item.get("title")) or "Suggested resource",
          "why": _safe_string(item.get("why")),
          "sections": _safe_string(item.get("sections")),
          "link": _safe_string(item.get("link")),
        })

      json_response(self, 200, {
        "answer": str(structured.get("answer", "")).strip(),
        "concepts": structured.get("concepts", []) if isinstance(structured.get("concepts", []), list) else [],
        "steps": structured.get("steps", []) if isinstance(structured.get("steps", []), list) else [],
        "materials": merged_materials[:10],
        "policy_note": str(structured.get("policy_note", "")).strip()
      })
    except Exception as exc:
      json_response(self, 500, {"error": str(exc)})

  def log_message(self, format, *args):
    return


if __name__ == "__main__":
  server = HTTPServer((HOST, PORT), Handler)
  print(f"Local API proxy running on http://{HOST}:{PORT}")
  print("Set env vars: YOUTUBE_API_KEY and GEMINI_API_KEY")
  server.serve_forever()
