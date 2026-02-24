"""
Local API bridge for QuxAT Plagicheck engines.

Run:
  python quxatplagicheck_api.py

Then POST to:
  http://127.0.0.1:8765/analyze
"""

from __future__ import annotations

import importlib.util
import json
import traceback
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent
QUX_ROOT = ROOT / "quxatplagicheck" / "plagiarism_hub"
PLUGINS_DIR = QUX_ROOT / "plugins"
CORPUS_DIR = ROOT / "plagiarism_corpus"

HOST = "127.0.0.1"
PORT = 8765

PLUGIN_FILES = {
    "tfidf_plugin": "tfidf_plugin.py",
    "difflib_plugin": "difflib_plugin.py",
    "simhash_plugin": "simhash_plugin.py",
    "sbert_plugin": "sbert_plugin.py",
    "rapidfuzz_plugin": "rapidfuzz_plugin.py",
    "ngram_plugin": "ngram_plugin.py",
}


def _load_module(name: str, file_path: Path):
    spec = importlib.util.spec_from_file_location(name, str(file_path))
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load plugin {name} from {file_path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _normalize_results(raw_results: dict[str, dict[str, Any]]) -> dict[str, Any]:
    if not raw_results:
        return {
            "max_score": 0.0,
            "average_score": 0.0,
            "tool_scores": {},
            "details": [],
        }

    scores = []
    tool_scores: dict[str, float] = {}
    details = []

    for engine_name, result in raw_results.items():
        score = 0.0
        if isinstance(result, dict) and "error" not in result:
            score = float(result.get("similarity_percentage", 0.0))
        score = max(0.0, min(100.0, score))
        scores.append(score)
        tool_scores[engine_name] = round(score, 2)
        details.append(result)

    max_score = max(scores) if scores else 0.0
    avg_score = (sum(scores) / len(scores)) if scores else 0.0

    return {
        "max_score": round(max_score, 2),
        "average_score": round(avg_score, 2),
        "tool_scores": tool_scores,
        "details": details,
    }


def _load_references_from_corpus() -> list[dict[str, str]]:
    references: list[dict[str, str]] = []
    if not CORPUS_DIR.exists():
        return references

    for path in CORPUS_DIR.glob("*.txt"):
        try:
            text = path.read_text(encoding="utf-8", errors="ignore")
            if text.strip():
                references.append({"id": path.name, "text": text})
        except Exception:
            continue
    return references


def _run_engines(input_text: str, references: list[dict[str, str]], engines: list[str] | None) -> dict[str, Any]:
    if not input_text.strip():
        raise ValueError("Input text is empty.")

    references = references or _load_references_from_corpus()
    if not references:
        raise ValueError("No references provided and no *.txt files found in plagiarism_corpus.")

    requested = engines or list(PLUGIN_FILES.keys())
    raw_results: dict[str, dict[str, Any]] = {}

    for engine_name in requested:
        plugin_file = PLUGINS_DIR / PLUGIN_FILES.get(engine_name, "")
        if not plugin_file.exists():
            raw_results[engine_name] = {
                "tool_name": engine_name,
                "similarity_percentage": 0.0,
                "matched_segments": [],
                "error": "Plugin file not found.",
            }
            continue

        try:
            module = _load_module(engine_name, plugin_file)
            if not hasattr(module, "run"):
                raise RuntimeError("Plugin has no run() function.")
            result = module.run(input_text, references)
            if not isinstance(result, dict):
                raise RuntimeError("Plugin returned non-dict result.")
            raw_results[engine_name] = result
        except Exception as exc:
            raw_results[engine_name] = {
                "tool_name": engine_name,
                "similarity_percentage": 0.0,
                "matched_segments": [],
                "error": str(exc),
            }

    normalized = _normalize_results(raw_results)
    normalized["references_count"] = len(references)
    return normalized


class Handler(BaseHTTPRequestHandler):
    def _send_json(self, status: int, payload: dict[str, Any]) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:  # noqa: N802
        self._send_json(200, {"ok": True})

    def do_GET(self) -> None:  # noqa: N802
        if self.path == "/health":
            self._send_json(
                200,
                {
                    "ok": True,
                    "service": "quxatplagicheck-api-bridge",
                    "plugins_dir": str(PLUGINS_DIR),
                    "available_engines": list(PLUGIN_FILES.keys()),
                    "corpus_dir": str(CORPUS_DIR),
                },
            )
            return

        self._send_json(404, {"ok": False, "error": "Not found"})

    def do_POST(self) -> None:  # noqa: N802
        if self.path != "/analyze":
            self._send_json(404, {"ok": False, "error": "Not found"})
            return

        try:
            content_len = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(content_len) if content_len > 0 else b"{}"
            payload = json.loads(raw.decode("utf-8"))

            text = str(payload.get("text", ""))
            references = payload.get("references", [])
            engines = payload.get("engines")
            if references is None:
                references = []
            if engines is not None and not isinstance(engines, list):
                raise ValueError("engines must be a list when provided.")

            result = _run_engines(text, references, engines)
            self._send_json(200, {"ok": True, **result})
        except Exception as exc:
            self._send_json(
                400,
                {
                    "ok": False,
                    "error": str(exc),
                    "trace": traceback.format_exc(limit=1),
                },
            )


def main() -> None:
    server = HTTPServer((HOST, PORT), Handler)
    print(f"[QuxAT API] Listening on http://{HOST}:{PORT}")
    print(f"[QuxAT API] Corpus directory: {CORPUS_DIR}")
    server.serve_forever()


if __name__ == "__main__":
    main()
