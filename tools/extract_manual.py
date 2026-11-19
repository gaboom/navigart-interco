"""Extract Pub. 102 (docs/ICS.pdf) into structured HTML fragments for the STUDY view.

Usage (from the repo root, Python with PyMuPDF installed):
    python -I tools/extract_manual.py

Writes:
    docs/data/manual/toc.json        chapter/section tree (from the PDF outline) with page numbers
    docs/data/manual/<chapter>.html  one HTML fragment per top-level outline entry
    docs/assets/fig/*.png            figures (drawings and images) rendered from the PDF

Conventions:
    PDF page = printed page + 5 for the body (printed page 1 is PDF page 6).
    Every page starts with an anchor  <a id="p{printed}"></a>  so that "page NN" references can link to it.
"""
import json
import re
import sys
from pathlib import Path

import pymupdf

ROOT = Path(__file__).resolve().parent.parent
PDF = ROOT / "docs" / "ICS.pdf"
OUT = ROOT / "docs" / "data" / "manual"
FIG = ROOT / "docs" / "assets" / "fig"
OFFSET = 5  # PDF page - printed page


def printed(pdf_page: int):
    return pdf_page - OFFSET if pdf_page >= 6 else None


def slug(s: str) -> str:
    s = re.sub(r"[^A-Za-z0-9]+", "-", s).strip("-").lower()
    return s[:60] or "x"


def esc(s: str) -> str:
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def clean(s: str) -> str:
    """Normalise the PDF's private glyphs. The book prints an ellipsis and its dashes with a glyph that the
    text layer reports as U+FFFD; tell them apart by context:
    digit-digit -> en dash (27-28), followed by space/closing/end -> ellipsis (lat... long...), otherwise em dash."""
    s = s.replace(" ", " ")

    def fix(m):
        i = m.start()
        before = s[i - 1] if i else ""
        after = s[m.end()] if m.end() < len(s) else ""
        if before.isdigit() and after.isdigit():
            return "–"
        if after == "" or after in " ),.;:?!”\"":
            return "…"
        return "—"

    return re.sub("�", fix, s)


HYPHENS = ("-", "­", "‐", "‑")
SENTENCE_END = re.compile(r"[.:;?!”\")]$")
PARA_START = re.compile(r"^(\d{1,2}\. |\([a-z]{1,3}\) |Examples?:|Notes?:|[A-Z]{2,3} [\"“(])")


def join_lines(parts):
    out = ""
    for t in parts:
        if not out:
            out = t
        elif out.endswith(HYPHENS) and t[:1].islower():
            out = out[:-1] + t  # hyphenated line break: re- + ceived -> received
        else:
            out += " " + t
    return re.sub(r"\s+", " ", out).strip()


def block_paragraphs(b):
    """Split a text block into paragraphs: a new one starts at a numbered/lettered item or after a short line ending a sentence."""
    paras, cur = [], []
    x1 = b["bbox"][2]
    for l in b["lines"]:
        t = clean("".join(s["text"] for s in l["spans"])).rstrip()
        if not t:
            continue
        if cur and PARA_START.match(t):
            paras.append(cur)
            cur = []
        cur.append(t)
        short = l["bbox"][2] < x1 - 28
        if short and SENTENCE_END.search(t) and not re.match(r"^\d{1,2}\.$", t):
            paras.append(cur)
            cur = []
    if cur:
        paras.append(cur)
    return [join_lines(p) for p in paras if p]


def block_text(b):
    """Join the lines of a text block into one paragraph, repairing end-of-line hyphenation."""
    return join_lines([clean("".join(s["text"] for s in l["spans"])).rstrip() for l in b["lines"]])


def first_span(b):
    return b["lines"][0]["spans"][0]


def is_bold(span):
    return bool(span["flags"] & 16) or "Bold" in span["font"]


CHAPTER_LINKS = {
    "1": "chapter-1-signaling-instructions",
    "2": "chapter-2-general-signal-code",
    "3": "chapter-3-medical-signal-code",
    "4": "chapter-4-distress-and-lifesaving-signals-and-radiotelephone",
}
MAX_PAGE = 154  # last printed page of the book


def page_link(n: str, label: str = None) -> str:
    n_int = int(n)
    if not 1 <= n_int <= MAX_PAGE:
        return label or n
    return f'<a class="xref" href="#/study/page/{n_int}">{label or n}</a>'


def link_refs(html: str) -> str:
    """Link cross-references: 'page 102', 'Pages 25 through 102', 'pages 25, 27 and 30', 'Chapter 2'.
    Page links go to #/study/page/N, which the app resolves to the right chapter and anchor."""
    def pages(m):
        word, rest = m.group(1), m.group(2)
        rest = re.sub(r"\d{1,3}", lambda x: page_link(x.group(0)), rest)
        return word + rest
    html = re.sub(r"\b([Pp]ages? )(\d{1,3}(?:(?:,| through| and| to| or|–|-) ?\d{1,3})*)\b", pages, html)

    def chap(m):
        cid = CHAPTER_LINKS.get(m.group(2))
        return f'{m.group(1)}<a class="xref" href="#/study/{cid}">{m.group(2)}</a>' if cid else m.group(0)
    html = re.sub(r"(\bChapters? )([1-4])\b(?![^<]*</a>)", chap, html)
    return html


def render_figures(page, pdf_page, taken):
    """Render drawing clusters and images as PNG; return [(y_top, <img> html)]."""
    figs = []
    rects = []
    for r in page.cluster_drawings():
        if r.width > 40 and r.height > 40:
            rects.append(r)
    for im in page.get_image_info():
        r = pymupdf.Rect(im["bbox"])
        if r.width > 30 and r.height > 30:
            rects.append(r)
    for i, r in enumerate(rects):
        # skip rectangles that are table borders (they are handled as tables)
        if any(r.intersects(t) and (r & t).get_area() > 0.6 * r.get_area() for t in taken):
            continue
        FIG.mkdir(parents=True, exist_ok=True)
        name = f"p{pdf_page:03d}-{i + 1}.png"
        clip = pymupdf.Rect(r.x0 - 4, r.y0 - 4, r.x1 + 4, r.y1 + 4) & page.rect
        page.get_pixmap(dpi=170, clip=clip).save(FIG / name)
        alt = f"Figure from printed page {printed(pdf_page)}"
        figs.append((r.y0, f'<figure><a href="assets/fig/{name}" class="zoom"><img loading="lazy" src="assets/fig/{name}" alt="{alt}" width="{int(clip.width)}" height="{int(clip.height)}"></a></figure>'))
    return figs


def cell_text(page, cell):
    """Text of one table cell, read by position so that word spacing is preserved."""
    if cell is None:
        return ""
    t = page.get_text("text", clip=pymupdf.Rect(cell))
    parts = [clean(x).strip() for x in t.split("\n") if x.strip()]
    return esc(join_lines(parts))


# A printed contents entry: dotted leaders followed by a page number. Dotted fill-in lines in signal texts are real content.
LEADER_PAGE = re.compile(r"([.] ?){6,}\s*[0-9]{1,3}(?=\s*[A-Z]{2,}|\s*$)")
NOTE_RE = re.compile(r"^(Notes?\b[: ]|\*\s)")


def table_html(page, tab, chapter_id="", pr=None):
    rows = [[cell_text(page, c) for c in row.cells] for row in tab.rows]
    if not rows:
        return ""
    # Printed contents tables (dotted leaders) are replaced by the app's own table of contents.
    if sum(1 for r in rows for c in r if LEADER_PAGE.search(c)) >= 2:
        return ""
    # Wrapped cell text comes out as extra rows that only fill one column: fold them back into the row above.
    folded = []
    for cells in rows:
        nz = [i for i, c in enumerate(cells) if c]
        if folded and nz and len(folded[-1]) == len(cells):
            k = max(nz, key=lambda i: len(cells[i]))  # the text column
            above = folded[-1][k]
            plain = re.sub(r"<[^>]+>", "", above)
            if above and cells[k][:1].islower() and (plain.endswith(HYPHENS) or not SENTENCE_END.search(plain)):
                folded[-1][k] = join_lines([above, cells[k]])
                for j in nz:  # other columns on the continuation line (for example a cross-reference code)
                    if j != k:
                        folded[-1][j] = join_lines([folded[-1][j], cells[j]]) if folded[-1][j] else cells[j]
                continue
        folded.append(list(cells))
    rows = folded
    has_note = any(NOTE_RE.match(c) for r in rows for c in r)
    out = ["<table>"]
    for ri, cells in enumerate(rows):
        header = (ri == 0 and len(rows) > 2 and all(3 <= len(c) <= 24 for c in cells) and not any(c.endswith(".") for c in cells))
        tag = "th" if header else "td"
        note_row = any(NOTE_RE.match(c) for c in cells)
        cells = [link_refs(c) for c in cells]
        # An asterisk before a code is a footnote marker: link it to the page's note.
        if chapter_id and pr:
            cells = [re.sub(r"^\*", f'<a class="fn" href="#/study/{chapter_id}/fn-p{pr}" title="Footnote">*</a>', c) if c.startswith("*") else c for c in cells]
        rid = f' id="fn-p{pr}"' if note_row and pr else ""
        out.append(f"<tr{rid}>" + "".join(f"<{tag}>{c}</{tag}>" for c in cells) + "</tr>")
    out.append("</table>")
    return "".join(out)


def page_items(page, pdf_page, chapter_id=""):
    """Return [(y, html)] for one page, in reading order (column-aware)."""
    items = []  # dicts: y0, y1, x0, html, kind
    tables = []
    try:
        for t in page.find_tables().tables:
            tables.append(t)
    except Exception:
        pass
    taken = [pymupdf.Rect(t.bbox) for t in tables]
    pr = printed(pdf_page)
    for t in tables:
        items.append({"y0": t.bbox[1], "y1": t.bbox[3], "x0": t.bbox[0], "html": table_html(page, t, chapter_id, pr), "kind": "table"})
    for y, h in render_figures(page, pdf_page, taken):
        items.append({"y0": y, "y1": y, "x0": 0, "html": h, "kind": "figure"})

    def in_table(line):
        cx, cy = (line["bbox"][0] + line["bbox"][2]) / 2, (line["bbox"][1] + line["bbox"][3]) / 2
        return any(t.x0 - 1 <= cx <= t.x1 + 1 and t.y0 - 1 <= cy <= t.y1 + 1 for t in taken)

    def is_chrome(line):
        """Running head at the top and the printed page number at the bottom."""
        if pdf_page < 6:
            return False
        if line["bbox"][1] < 60:
            return True
        size = line["spans"][0]["size"]
        return line["bbox"][1] > 730 and size <= 10.5

    blocks = []
    for b in page.get_text("dict")["blocks"]:
        if "lines" not in b or not b["lines"]:
            continue
        # Keep only content lines: not part of a table, not the running head or page number.
        kept = [l for l in b["lines"] if not in_table(l) and not is_chrome(l)]
        if not kept:
            continue
        if len(kept) != len(b["lines"]):
            b = dict(b, lines=kept, bbox=(min(l["bbox"][0] for l in kept), min(l["bbox"][1] for l in kept),
                                          max(l["bbox"][2] for l in kept), max(l["bbox"][3] for l in kept)))
        # Split the block wherever the style changes (a bold heading line followed by body text).
        def style(l):
            return (all(is_bold(s) for s in l["spans"]), round(l["spans"][0]["size"]))
        groups = []
        for l in b["lines"]:
            if groups and style(groups[-1][-1]) == style(l):
                groups[-1].append(l)
            else:
                groups.append([l])
        for g in groups:
            blocks.append(dict(b, lines=g, bbox=(min(l["bbox"][0] for l in g), min(l["bbox"][1] for l in g),
                                                 max(l["bbox"][2] for l in g), max(l["bbox"][3] for l in g))))

    # Two-column text pages (for example the tables of complements) are read column by column.
    left = [b for b in blocks if b["bbox"][2] <= 312 and b["bbox"][2] - b["bbox"][0] < 290]
    right = [b for b in blocks if b["bbox"][0] >= 295 and b["bbox"][2] - b["bbox"][0] < 290]
    two_col = len(left) >= 3 and len(right) >= 3

    for b in blocks:
        x0, y0, x1, y1 = b["bbox"]
        sp = first_span(b)
        txt = block_text(b)
        if not txt:
            continue
        # Printed contents lists (dotted leaders) are replaced by the app's own table of contents.
        if LEADER_PAGE.search(txt) or txt.strip() in ("PAGE", "CONTENTS"):
            continue
        size = round(sp["size"], 1)
        bold = all(is_bold(s) for l in b["lines"] for s in l["spans"])  # the whole group is bold
        kind = "p"
        if size >= 17 and bold:
            h, kind = f"<h2>{esc(txt)}</h2>", "h"
        elif size >= 14 and bold:
            h, kind = f"<h3>{esc(txt)}</h3>", "h"
        elif size >= 13 and bold:
            h, kind = f"<h4>{esc(txt)}</h4>", "h"
        elif bold and len(b["lines"]) <= 2:
            h, kind = f"<h5>{esc(txt)}</h5>", "h"
        else:
            ps = block_paragraphs(b)
            h = "".join(
                f'<p{" id=fn-p" + str(pr) if re.match(r"^Notes?\b[: ]", p) and pr else ""}>{link_refs(esc(p))}</p>' for p in ps
            )
        col = (1 if x0 >= 295 else 0) if two_col else 0
        items.append({"y0": y0, "y1": y1, "x0": x0, "html": h, "kind": kind, "col": col})

    items.sort(key=lambda d: (d.get("col", 0), d["y0"]))

    # A signal row: the bold code sits in its own block, the meaning in the block to its right on the same line.
    CODE_ONLY = re.compile(r"^<h5>(\*?[A-Z]{1,3}(?: ?[0-9]{1,2})?)</h5>$")
    rows = []
    i = 0
    while i < len(items):
        d = items[i]
        m = CODE_ONLY.match(d["html"]) if d["kind"] == "h" else None
        nxt = items[i + 1] if i + 1 < len(items) else None
        if m and nxt and nxt["kind"] == "p" and abs(nxt["y0"] - d["y0"]) < 8 and nxt["x0"] > d["x0"]:
            first = re.match(r"<p[^>]*>(.*?)</p>", nxt["html"], re.S)
            if first:
                rest = nxt["html"][first.end():]
                code = m.group(1)
                d = dict(d, kind="p", html=f'<p class="sig"><strong class="code">{code}</strong> {first.group(1)}</p>{rest}',
                         y1=nxt["y1"])
                items[i + 1] = None
                rows.append(d)
                i += 2
                continue
        rows.append(d)
        i += 1
    items = [d for d in rows if d]

    # A footnote anchor id must be unique on the page: keep the first.
    seen_fn = False
    for d in items:
        if re.search(r' id="?fn-p\d+"?', d["html"]):
            if seen_fn:
                d["html"] = re.sub(r' id="?fn-p\d+"?', "", d["html"])
            seen_fn = True

    # Join a paragraph that continues across blocks (its sentence has not ended), within the same column:
    # the last paragraph of the previous block absorbs the first paragraph of the next one.
    P = re.compile(r"<p[^>]*>.*?</p>", re.S)
    merged = []
    for d in items:
        prev = merged[-1] if merged else None
        if (prev and d["kind"] == "p" and prev["kind"] == "p" and d.get("col", 0) == prev.get("col", 0)
                and d["y0"] - prev["y1"] < 6 and abs(d["x0"] - prev["x0"]) < 60):
            pp, dp = P.findall(prev["html"]), P.findall(d["html"])
            if pp and dp:
                ptxt = re.sub(r"<[^>]+>", "", pp[-1])
                ctxt = re.sub(r"<[^>]+>", "", dp[0])
                if ptxt and ctxt and not SENTENCE_END.search(ptxt):
                    body, joiner = pp[-1][:-4], " "
                    if ptxt.endswith(HYPHENS) and ctxt[:1].islower():  # word hyphenated across blocks: com- + plete
                        body, joiner = body[:-1], ""
                    pp[-1] = body + joiner + re.sub(r"^<p[^>]*>", "", dp[0])
                    prev["html"] = "".join(pp) + "".join(dp[1:])
                    prev["y1"] = d["y1"]
                    continue
        merged.append(d)
    return [(d["y0"], d["html"]) for d in merged]


TRAILING_PAGES = re.compile(r"((?:\d{1,3}(?:–\d{1,3})?)(?:, ?\d{1,3}(?:–\d{1,3})?)*)$")


def index_columns(page, ymin=62):
    """Split an index page into columns using the empty vertical gutters between word boxes."""
    words = [w for w in page.get_text("words") if ymin < w[1] < 742]
    cov = [0] * 613
    for w in words:
        for x in range(max(0, int(w[0])), min(612, int(w[2]) + 1)):
            cov[x] = 1
    cuts, run = [], 0
    for x in range(40, 580):
        if cov[x] == 0:
            run += 1
        else:
            if run >= 8:
                cuts.append(x - run // 2)
            run = 0
    cols = [[] for _ in range(len(cuts) + 1)]
    for w in words:
        k = sum(1 for c in cuts if w[0] >= c)
        cols[k].append(w)
    return cols


def column_lines(words):
    words = sorted(words, key=lambda w: (round(w[1]), w[0]))
    lines, cur, cy = [], [], None
    for w in words:
        if cy is None or abs(w[1] - cy) < 3.5:
            cur.append(w)
            cy = w[1] if cy is None else cy
        else:
            lines.append(cur)
            cur, cy = [w], w[1]
    if cur:
        lines.append(cur)
    return [(min(w[0] for w in l), " ".join(w[4] for w in sorted(l, key=lambda w: w[0]))) for l in lines]


def index_entry_html(text, level):
    text = text.replace("�", "–").replace("—", "–")
    text = re.sub(r"\s+", " ", text).strip()
    m = TRAILING_PAGES.search(text)
    if m and (m.start() == 0 or text[m.start() - 1] in " ,"):
        term = text[: m.start()].rstrip(" ,")
        refs = re.split(r", ?", m.group(1))
        links = ", ".join(page_link(re.match(r"\d+", r).group(0), r) for r in refs)
        body = f'<span class="t">{esc(term)}</span> <span class="r">{links}</span>' if term else f'<span class="r">{links}</span>'
    else:
        body = f'<span class="t">{esc(text)}</span>'
    return f'<div class="ix l{level}">{body}</div>'


def index_html(doc, c):
    """Render an index chapter (three printed columns) as linked entries with a letter bar."""
    out, letters = [], []
    prev = None  # [level, text, offset]

    def flush():
        nonlocal prev
        if prev:
            out.append(index_entry_html(prev[1], prev[0]))
            prev = None

    for pn in range(c["pdfStart"], c["pdfEnd"] + 1):
        page = doc[pn - 1]
        pr = printed(pn)
        out.append(f'<a id="p{pr}" class="pageno" data-pdf="{pn}"></a>')
        out.append(f'<div class="pagemark" aria-hidden="true">page {pr}</div>')
        first = pn == c["pdfStart"]
        if first:  # the printed heading of the index
            head = [w for w in page.get_text("words") if 60 < w[1] < 118]
            for _, t in column_lines(head):
                out.append(f'<p class="ixhead">{esc(clean(t))}</p>')
        for col in index_columns(page, 118 if first else 62):
            lines = column_lines(col)
            body = [l for l in lines if not (len(l[1]) == 1 and l[1].isalpha())]
            if not body:
                continue
            base = min(o for o, _ in body)
            for off, text in lines:
                text = clean(text)
                if len(text) == 1 and text.isalpha():  # letter heading
                    flush()
                    letters.append(text)
                    out.append(f'<h3 id="ix-{c["id"]}-{text}" class="ixh">{text}</h3>')
                    continue
                rel = off - base
                cont = prev is not None and (
                    5 <= rel < 14
                    or (not re.search(r"\d$", prev[1]) and re.search(r"[,\-­]$", prev[1]) and rel >= prev[2] - 1)
                )
                if cont:
                    prev[1] = join_lines([prev[1], text])
                else:
                    flush()
                    prev = [0 if rel < 5 else 1 if rel < 23 else 2, text, rel]
    flush()
    nav = "".join(f'<a href="#/study/{c["id"]}/ix-{c["id"]}-{l}">{l}</a>' for l in dict.fromkeys(letters))
    return f'<div class="ixnav">{nav}</div>\n<div class="ixlist">' + "\n".join(out) + "</div>"


SMALL = {"and", "of", "the", "for", "to", "by", "in", "on", "or", "with", "between", "a"}


def nice(t: str) -> str:
    """Tidy outline titles: 'Chapter 2-GENERAL SIGNAL CODE' -> 'Chapter 2 · General Signal Code'."""
    t = clean(t).strip()
    m = re.match(r"(?i)chapter\s+(\d+)\s*[-–—]\s*(.*)", t)
    prefix = ""
    if m:
        prefix, t = f"Chapter {m.group(1)} · ", m.group(2).strip()
    if t.isupper() or t.islower() or prefix:
        idx = [0]

        def cap(m):
            w = m.group(0)
            i = idx[0]
            idx[0] += 1
            return w if (i and w in SMALL) else w[:1].upper() + w[1:]

        t = re.sub(r"[a-z0-9'.]+", cap, t.lower())
    return prefix + t


def main():
    doc = pymupdf.open(PDF)
    toc = [[l, nice(t), p] for l, t, p in doc.get_toc()]
    OUT.mkdir(parents=True, exist_ok=True)

    # Top-level chapters = level-1 outline entries.
    tops = [(t[1].strip(), t[2]) for t in toc if t[0] == 1]
    chapters = []
    for i, (title, start) in enumerate(tops):
        end = (tops[i + 1][1] - 1) if i + 1 < len(tops) else len(doc)
        chapters.append({"id": slug(title), "title": title, "pdfStart": start, "pdfEnd": max(start, end),
                         "start": printed(start), "end": printed(max(start, end))})
    # Ensure unique ids
    seen = {}
    for c in chapters:
        n = seen.get(c["id"], 0)
        seen[c["id"]] = n + 1
        if n:
            c["id"] += f"-{n + 1}"

    for c in chapters:
        parts = []
        if c["id"] in ("signal-index", "medical-index"):
            (OUT / f"{c['id']}.html").write_text(index_html(doc, c) + "\n", encoding="utf-8")
            continue
        for pn in range(c["pdfStart"], c["pdfEnd"] + 1):
            page = doc[pn - 1]
            pr = printed(pn)
            anchor = f'<a id="p{pr}" class="pageno" data-pdf="{pn}"></a>' if pr is not None else f'<a id="pdf{pn}"></a>'
            parts.append(anchor)
            parts.append(f'<div class="pagemark" aria-hidden="true">{"page " + str(pr) if pr is not None else ""}</div>')
            for _, h in page_items(page, pn, c["id"]):
                parts.append(h)
        (OUT / f"{c['id']}.html").write_text("\n".join(parts) + "\n", encoding="utf-8")

    # Outline tree with chapter ids and printed pages.
    def chap_for(pdf_page):
        for c in chapters:
            if c["pdfStart"] <= pdf_page <= c["pdfEnd"]:
                return c["id"]
        return chapters[-1]["id"]

    outline = []
    for lvl, title, pg in toc:
        title = clean(title).strip()
        outline.append({"level": lvl, "title": title, "pdfPage": pg, "page": printed(pg), "chapter": chap_for(pg), "anchor": f"p{printed(pg)}" if printed(pg) else None})
    (OUT / "toc.json").write_text(json.dumps({"chapters": chapters, "outline": outline, "offset": OFFSET}, indent=1) + "\n", encoding="utf-8")
    print(f"{len(chapters)} chapters, {len(outline)} outline entries, figures: {len(list(FIG.glob('*.png')))}")


if __name__ == "__main__":
    sys.exit(main())
