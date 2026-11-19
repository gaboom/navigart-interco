"""Verify the extracted manual against the PDF, page by page.

Usage (from the repo root): python -I tools/verify_manual.py [--verbose]

For every body page it compares the multiset of words in the PDF text layer with the words in the generated
HTML (docs/data/manual/*.html), and reports:
  missing  words that are in the PDF but not in the HTML (lost content)
  extra    words that are in the HTML but not in the PDF (invented or mangled content)
Pages that are intentionally dropped (printed contents lists, running heads, page numbers) are excluded
from the expectation. Exit code 1 if any page exceeds the tolerance.
"""
import html
import json
import re
import sys
from collections import Counter
from pathlib import Path

import pymupdf

ROOT = Path(__file__).resolve().parent.parent
PDF = ROOT / "docs" / "ICS.pdf"
MAN = ROOT / "docs" / "data" / "manual"
OFFSET = 5
VERBOSE = "--verbose" in sys.argv
STRICT = "--strict" in sys.argv  # report every difference, however small
CONTENTS = {}  # pdf page -> True for printed contents pages (filled in main)
LEADER_PAGE = re.compile(r"([.] ?){6,}\s*[0-9]{1,3}(?=\s*[A-Z]{2,}|\s*$)")


def norm_tokens(text: str):
    text = text.replace("�", " ").replace("­", "")
    text = re.sub(r"[‐‑–—\-]+", " ", text)
    toks = re.findall(r"[A-Za-z0-9]+", text.lower())
    return toks


def pdf_tokens(page, pdf_page):
    lines = {}
    for w in page.get_text("words"):
        x0, y0, x1, y1, t, b, l = w[:7]
        if y0 < 60 and pdf_page >= 6:  # running head
            continue
        if y0 > 730 and (y1 - y0) < 11:  # page number
            continue
        lines.setdefault((b, l), []).append(t)
    texts = []
    for ws in lines.values():
        line = " ".join(ws)
        if LEADER_PAGE.search(line) or line.strip() == "PAGE":  # printed contents entries are dropped on purpose
            continue
        texts.append(line)
    # Join words hyphenated across line breaks, as the extractor does (re-/ceived -> received).
    toks, i = [], 0
    while i < len(texts):
        t = texts[i]
        while t.endswith(("-", "­")) and i + 1 < len(texts):
            t = t[:-1] + texts[i + 1]
            i += 1
        toks.append(t)
        i += 1
    return norm_tokens(" ".join(toks))


def html_pages():
    """Yield (printed_page, tokens) for every page anchor in the generated HTML."""
    for f in sorted(MAN.glob("*.html")):
        src = f.read_text(encoding="utf-8")
        parts = re.split(r'<a id="(p\d+|pdf\d+)"[^>]*></a>', src)
        for i in range(1, len(parts), 2):
            body = parts[i + 1]
            body = re.sub(r'<div class="pagemark".*?</div>', " ", body)
            body = re.sub(r"<[^>]+>", " ", body)
            yield parts[i], norm_tokens(html.unescape(body)), f.stem


def main():
    doc = pymupdf.open(PDF)
    for pn in range(1, len(doc) + 1):
        text = doc[pn - 1].get_text("text")
        if len([1 for line in text.split("\n") if LEADER_PAGE.search(line)]) >= 3:
            CONTENTS[pn] = True
    got = {pid: (toks, ch) for pid, toks, ch in html_pages()}
    bad, checked = 0, 0
    tot_missing = tot_extra = tot_words = 0
    for pn in range(1, len(doc) + 1):
        pr = pn - OFFSET if pn >= 6 else None
        pid = f"p{pr}" if pr else f"pdf{pn}"
        if pid not in got:
            continue
        exp = Counter(pdf_tokens(doc[pn - 1], pn))
        act = Counter(got[pid][0])
        missing = exp - act
        extra = act - exp
        m, e, n = sum(missing.values()), sum(extra.values()), sum(exp.values())
        checked += 1
        tot_missing += m
        tot_extra += e
        tot_words += n
        tol = 0 if STRICT else max(3, int(0.02 * n))
        if CONTENTS.get(pn) and not STRICT:
            continue  # printed contents page: dropped on purpose (the app builds its own table of contents)
        if m > tol or e > tol:
            bad += 1
            print(f"{pid:>7} ({got[pid][1]}): words {n:4d}  missing {m:3d}  extra {e:3d}")
            if VERBOSE:
                print("         missing:", " ".join(sorted(missing.elements())[:25]))
                print("         extra:  ", " ".join(sorted(extra.elements())[:25]))
    print(f"\n{checked} pages checked, {tot_words} PDF words; missing {tot_missing} ({100*tot_missing/max(1,tot_words):.2f}%), "
          f"extra {tot_extra} ({100*tot_extra/max(1,tot_words):.2f}%); pages over tolerance: {bad}")

    # Garbage patterns in the generated files.
    problems = Counter()
    for f in MAN.glob("*.html"):
        s = f.read_text(encoding="utf-8")
        text = html.unescape(re.sub(r"<[^>]+>", " ", s))
        if "�" in text:
            problems[f"{f.stem}: replacement character"] += text.count("�")
        for m in re.finditer(r"\b[a-z]{3,} [a-z]{2,4}\b", text):
            pass
        if LEADER_PAGE.search(text):
            problems[f"{f.stem}: dotted leaders with page numbers"] += 1
    for k, v in problems.items():
        print("PROBLEM", k, v)
    return 1 if bad or problems else 0


if __name__ == "__main__":
    sys.exit(main())
