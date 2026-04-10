"""Display a concise coverage summary after pr-check test runs."""
import json
from pathlib import Path

BACKEND_COV = Path("/tmp/backend-cov.json")
FRONTEND_COV = Path("frontend/coverage/coverage-summary.json")

W = 51  # box inner width


def box_line(text: str = "") -> str:
    return f"│ {text:<{W-2}} │"


def hline(left: str = "├", right: str = "┤") -> str:
    return f"{left}{'─' * (W - 2)}{right}"


def bar(pct: float, width: int = 20) -> str:
    filled = round(pct / 100 * width)
    colour = "✅" if pct >= 80 else ("⚠️ " if pct >= 70 else "❌")
    return f"{'█' * filled}{'░' * (width - filled)} {colour}"


lines = [
    f"╔{'═' * (W - 2)}╗",
    box_line("  📊  Coverage Summary"),
    hline("╠", "╣"),
]

# ── Backend ──────────────────────────────────────────────────
if BACKEND_COV.exists():
    data = json.loads(BACKEND_COV.read_text())
    totals = data.get("totals", {})
    pct = totals.get("percent_covered", 0.0)
    covered = totals.get("covered_lines", 0)
    num_stmts = totals.get("num_statements", 0)
    lines += [
        box_line("  Python (backend)"),
        box_line(f"    Statements: {pct:5.1f}%  ({covered}/{num_stmts})"),
        box_line(f"    {bar(pct)}"),
    ]
else:
    lines.append(box_line("  Python (backend): no data"))

lines.append(hline())

# ── Frontend ─────────────────────────────────────────────────
if FRONTEND_COV.exists():
    data = json.loads(FRONTEND_COV.read_text())
    t = data.get("total", {})
    stmts = t.get("statements", {}).get("pct", 0.0)
    fns = t.get("functions", {}).get("pct", 0.0)
    branches = t.get("branches", {}).get("pct", 0.0)
    lns = t.get("lines", {}).get("pct", 0.0)
    lines += [
        box_line("  TypeScript (frontend)"),
        box_line(f"    Statements: {stmts:5.1f}%  {bar(stmts, 12)}"),
        box_line(f"    Functions:  {fns:5.1f}%  {bar(fns,  12)}"),
        box_line(f"    Branches:   {branches:5.1f}%  {bar(branches, 12)}"),
        box_line(f"    Lines:      {lns:5.1f}%  {bar(lns,  12)}"),
    ]
else:
    lines.append(box_line("  TypeScript (frontend): no data"))

lines.append(f"╚{'═' * (W - 2)}╝")

print("\n".join(lines))
