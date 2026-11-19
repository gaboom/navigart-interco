"""Build docs/data/signals.json (general and medical signal codes) from the extracted manual HTML.

Usage (from the repo root): python -I tools/gen_signals.py   (run tools/extract_manual.py first)

Each record:
  code      "AE 1", "MCU"
  base      the code without its complement ("AE")
  text      the meaning (English)
  topic     the subject heading (for example "Abandon", "Mental State and Consciousness")
  group     the section or major heading (for example "Distress-Emergency", "Particular Symptoms")
  chapter   "general" (chapter 2) or "medical" (chapter 3)
  page      printed page in Pub. 102
  star      true if the manual marks the code with an asterisk
  xref      cross-reference code(s) printed in the right-hand column, if any
Language-neutral facts (code, page) are kept apart from text under `text.en`, as the data model requires.
"""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MAN = ROOT / "docs" / "data" / "manual"
OUT = ROOT / "docs" / "data" / "signals.json"

CODE = re.compile(r"^\*?([A-Z]{2,3})(?: ?([0-9]{1,2}))?$")
TOKEN = re.compile(
    r'(?P<anchor><a id="p(?P<page>\d+)"[^>]*></a>)'
    r'|<h(?P<hl>[2-5])[^>]*>(?P<ht>.*?)</h(?P=hl)>'
    r'|<p class="sig"><strong class="code">(?P<sc>[^<]+)</strong> (?P<st>.*?)</p>'
    r'|<tr[^>]*>(?P<row>.*?)</tr>',
    re.S,
)


def plain(s: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", s))).strip()


def title(s: str) -> str:
    return s if not s.isupper() else " ".join(w.capitalize() if w.lower() not in ("and", "of", "the", "to", "for") else w.lower() for w in s.split(" "))


def parse(chapter_file: str, kind: str):
    src = (MAN / chapter_file).read_text(encoding="utf-8")
    page, group, topic = None, "", ""
    out = []
    for m in TOKEN.finditer(src):
        if m.group("page"):
            page = int(m.group("page"))
        elif m.group("hl"):
            t = plain(m.group("ht"))
            if re.match(r"^\*?[A-Z]{1,3}(?: ?[0-9]{1,2})?$", t):
                continue  # a stray code label
            if m.group("hl") in ("2", "3"):
                if t.upper().startswith("CHAPTER") and not t.upper().startswith("CHAPTER ") is False and re.match(r"(?i)^chapter \d+$", t):
                    continue
                group, topic = title(re.sub(r"^SECTION \d+:\s*", "", t, flags=re.I)), ""
            else:
                if t.isupper() and len(t) > 3:  # a major heading in capitals starts a new group
                    group, topic = title(t), ""
                else:
                    topic = title(t)
        elif m.group("sc") is not None:
            code_raw, text = plain(m.group("sc")), plain(m.group("st"))
            cm = CODE.match(code_raw)
            if cm and text:
                out.append(record(code_raw, cm, text, topic, group, page, kind))
        elif m.group("row"):
            cells = [plain(c) for c in re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>", m.group("row"), re.S)]
            cells = [c for c in cells]
            idx = next((i for i, c in enumerate(cells[:2]) if CODE.match(c)), None)
            if idx is None:
                continue
            text_cells = [c for i, c in enumerate(cells) if i > idx and c and not CODE.match(c)]
            text = max(text_cells, key=len) if text_cells else ""
            if not text:
                continue
            code_raw = cells[idx]
            # An asterisked row repeats its code in the first cell; a sub-code ("AE 1") sits in the second column.
            cm = CODE.match(code_raw)
            rec = record(code_raw, cm, text, topic, group, page, kind)
            tail = [c for c in cells[idx + 1:] if CODE.match(c) and c != code_raw]
            if tail:
                rec["xref"] = tail
            out.append(rec)
    return out


def record(code_raw, cm, text, topic, group, page, kind):
    base = cm.group(1)
    code = base + (f" {cm.group(2)}" if cm.group(2) else "")
    return {
        "code": code,
        "base": base,
        "chapter": kind,
        "topic": topic,
        "group": group,
        "page": page,
        "star": code_raw.startswith("*"),
        "text": {"en": text},
    }


def main():
    general = parse("chapter-2-general-signal-code.html", "general")
    medical = parse("chapter-3-medical-signal-code.html", "medical")
    # Medical codes all start with M; keep only plausible ones in each chapter.
    medical = [r for r in medical if r["code"].startswith("M")]
    general = [r for r in general if not r["code"].startswith("M") or len(r["base"]) == 2]
    data = {"version": 1, "edition": "NGA Pub. 102, 1969 (Revised 2020)", "languages": ["en"], "signals": general + medical}
    OUT.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    codes = {}
    for r in data["signals"]:
        codes.setdefault((r["chapter"], r["code"]), 0)
        codes[(r["chapter"], r["code"])] += 1
    dup = [k for k, v in codes.items() if v > 1]
    print(f"general {len(general)}, medical {len(medical)}, unique {len(codes)}, duplicated codes {len(dup)}: {dup[:10]}")


if __name__ == "__main__":
    main()
