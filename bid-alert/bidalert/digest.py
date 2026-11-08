"""알림 메일 본문(HTML·텍스트)과 CSV 첨부 만들기.

메일 클라이언트 호환을 위해 HTML은 표 레이아웃 + 인라인 스타일만 쓴다.
"""

from __future__ import annotations

import csv
import io
import os
from dataclasses import dataclass, field
from datetime import datetime
from html import escape

from .ai import Briefing
from .config import Subscriber
from .matcher import Match
from .models import KIND_NAMES, KST, format_won

WEEKDAYS = "월화수목금토일"
MAX_IN_BODY = 60  # 본문에 다 싣는 최대 건수. 나머지는 CSV 첨부로.
URGENT_DAYS = 3


def brand() -> str:
    return os.environ.get("BIDALERT_BRAND") or "맞춤 입찰 알림"


def contact() -> str:
    return os.environ.get("BIDALERT_CONTACT") or ""


def kdate(dt: datetime | None, with_time: bool = True) -> str:
    if not dt:
        return "미상"
    dt = dt.astimezone(KST)
    s = f"{dt.month}/{dt.day}({WEEKDAYS[dt.weekday()]})"
    return f"{s} {dt:%H:%M}" if with_time else s


def _safe_url(url: str) -> str:
    return url if url.startswith(("https://", "http://")) else ""


@dataclass
class Digest:
    subject: str
    html: str
    text: str
    csv_bytes: bytes | None
    count: int
    urgent: int
    attachments: list[tuple[str, bytes, str]] = field(default_factory=list)


def _dday(days: int | None) -> tuple[str, str]:
    """(라벨, 색)"""
    if days is None:
        return "", ""
    if days <= 0:
        return "오늘 마감", "#c62828"
    if days <= URGENT_DAYS:
        return f"D-{days}", "#c62828"
    return f"D-{days}", "#546e7a"


def _box(inner_html: str, bg: str, color: str, padding: str = "10px 14px") -> str:
    """위아래 간격을 둔 색 상자 한 줄(표 행). inner_html은 이미 escape된 HTML이어야 한다."""
    return (
        f'<tr><td style="padding:0 0 10px;"><div style="padding:{padding};background:{bg};border-radius:10px;'
        f'color:{color};font-size:13px;line-height:1.6;">{inner_html}</div></td></tr>'
    )


def _badge(label: str, color: str, bg: str) -> str:
    return (
        f'<span style="display:inline-block;padding:2px 8px;margin-right:4px;border-radius:10px;'
        f'font-size:12px;font-weight:600;color:{color};background:{bg};">{escape(label)}</span>'
    )


def _item_html(m: Match, now: datetime) -> str:
    n = m.notice
    badges = [_badge(n.kind_name, "#1a237e", "#e8eaf6")]
    if n.bid_ord and n.bid_ord.lstrip("0"):
        badges.append(_badge("정정·재공고", "#6d4c41", "#efebe9"))
    label, color = _dday(n.days_left(now))
    if label:
        bg = "#ffebee" if color == "#c62828" else "#eceff1"
        badges.append(_badge(label, color, bg))

    url = _safe_url(n.url)
    title = escape(n.title)
    title_html = (
        f'<a href="{escape(url)}" style="color:#0d47a1;text-decoration:none;">{title}</a>' if url else title
    )
    org = escape(n.org)
    if n.demand_org and n.demand_org != n.org:
        org += f' <span style="color:#78909c;">· 수요 {escape(n.demand_org)}</span>'
    facts = [
        f"<b>{escape(format_won(n.amount))}</b>",
        f"마감 {escape(kdate(n.close_at))}",
    ]
    method = " / ".join(x for x in (n.method, n.contract_method) if x)
    if method:
        facts.append(escape(method))
    if n.region_limit:
        facts.append(f"지역제한 {escape(n.region_limit)}")

    reason = ""
    if m.ai_reason:
        reason = (
            '<div style="margin-top:6px;padding:6px 10px;background:#fff8e1;border-radius:6px;'
            f'font-size:13px;color:#5d4037;">추천 이유: {escape(m.ai_reason)}</div>'
        )
    return f"""
<tr><td style="padding:14px 0;border-bottom:1px solid #eceff1;">
  <div>{''.join(badges)}</div>
  <div style="margin-top:6px;font-size:16px;font-weight:700;line-height:1.45;">{title_html}</div>
  <div style="margin-top:4px;font-size:13px;color:#455a64;">{org}</div>
  <div style="margin-top:4px;font-size:13px;color:#455a64;">{' · '.join(facts)}</div>
  <div style="margin-top:4px;font-size:12px;color:#90a4ae;">공고번호 {escape(n.key)} · 키워드 {escape(', '.join(m.keywords))}</div>
  {reason}
</td></tr>"""


def _item_text(m: Match, now: datetime) -> str:
    n = m.notice
    label, _ = _dday(n.days_left(now))
    head = f"[{n.kind_name}]{' [' + label + ']' if label else ''} {n.title}"
    lines = [
        head,
        f"  기관: {n.org}" + (f" (수요 {n.demand_org})" if n.demand_org and n.demand_org != n.org else ""),
        f"  {format_won(n.amount)} · 마감 {kdate(n.close_at)}"
        + (f" · {n.method}" if n.method else ""),
    ]
    if m.ai_reason:
        lines.append(f"  추천 이유: {m.ai_reason}")
    if _safe_url(n.url):
        lines.append(f"  {n.url}")
    return "\n".join(lines)


def build_csv(matches: list[Match]) -> bytes:
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(
        ["구분", "공고번호", "공고명", "공고기관", "수요기관", "추정가격(원)", "마감일시", "개찰일시",
         "입찰방식", "계약방법", "참가제한지역", "맞은 키워드", "AI 추천", "상세 주소"]
    )
    for m in matches:
        n = m.notice
        w.writerow(
            [
                n.kind_name, n.key, n.title, n.org, n.demand_org, n.amount or "",
                n.close_at.strftime("%Y-%m-%d %H:%M") if n.close_at else "",
                n.open_at.strftime("%Y-%m-%d %H:%M") if n.open_at else "",
                n.method, n.contract_method, n.region_limit, ", ".join(m.keywords),
                m.ai_reason, n.url,
            ]
        )
    return buf.getvalue().encode("utf-8-sig")  # 엑셀에서 한글이 깨지지 않도록 BOM 포함


def build_digest(
    sub: Subscriber,
    matches: list[Match],
    *,
    now: datetime,
    window: tuple[datetime, datetime],
    briefing: Briefing | None = None,
    errors: dict[str, str] | None = None,
    sample: bool = False,
) -> Digest:
    now_k = now.astimezone(KST)
    count = len(matches)
    urgent = sum(1 for m in matches if (d := m.notice.days_left(now)) is not None and d <= URGENT_DAYS)
    date_label = f"{now_k.month}월 {now_k.day}일({WEEKDAYS[now_k.weekday()]})"
    subject = f"[{brand()}] {date_label} 맞춤 입찰공고 {count}건" + (f" · 마감임박 {urgent}건" if urgent else "")
    if sample:
        subject = "[샘플] " + subject

    shown = matches[:MAX_IN_BODY]
    picks = [m for m in shown if m.ai_pick]
    rest = [m for m in shown if not m.ai_pick]
    w_start, w_end = window
    window_label = f"{kdate(w_start)} ~ {kdate(w_end)}"

    # ---------- HTML ----------
    parts: list[str] = []
    if sample:
        parts.append(
            _box("샘플 메일입니다. 아래 공고는 화면 예시를 위해 만든 가상의 데이터이며 실제 공고가 아닙니다.",
                 "#fff3e0", "#e65100")
        )
    if errors:
        failed = ", ".join(KIND_NAMES.get(k, k) for k in errors)
        parts.append(
            _box(f"{escape(failed)} 공고는 나라장터 응답 오류로 이번 메일에서 빠졌습니다. 확인 후 따로 안내드리겠습니다.",
                 "#ffebee", "#b71c1c")
        )
    if briefing and briefing.text:
        parts.append(
            _box(
                '<div style="font-size:13px;font-weight:700;color:#0d47a1;">오늘의 브리핑</div>'
                f'<div style="margin-top:6px;font-size:14px;line-height:1.6;color:#263238;">{escape(briefing.text)}</div>',
                "#e3f2fd", "#263238", padding="14px 16px",
            )
        )

    def section(title: str, items: list[Match]) -> str:
        rows = "".join(_item_html(m, now) for m in items)
        return (
            f'<tr><td style="padding:22px 0 4px;font-size:15px;font-weight:800;color:#263238;">{escape(title)}</td></tr>'
            f'<tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0">{rows}</table></td></tr>'
        )

    if not matches:
        parts.append(
            '<tr><td style="padding:28px 0;font-size:14px;color:#455a64;line-height:1.7;">'
            "이번 수집 기간에는 조건에 맞는 새 공고가 없었습니다.<br>"
            "키워드나 금액 범위를 넓히고 싶으시면 이 메일에 회신해 주세요.</td></tr>"
        )
    if picks:
        parts.append(section("우선 검토 추천", picks))
    if rest:
        parts.append(section("전체 맞춤 공고" if not picks else "그 밖의 맞춤 공고", rest))
    if count > len(shown):
        parts.append(
            f'<tr><td style="padding:12px 0;font-size:13px;color:#455a64;">외 {count - len(shown)}건은 '
            "첨부한 엑셀(CSV) 파일에서 모두 확인하실 수 있습니다.</td></tr>"
        )

    contact_line = f" · 문의 {escape(contact())}" if contact() else ""
    html = f"""<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{escape(subject)}</title></head>
<body style="margin:0;padding:0;background:#f5f7fa;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border-radius:14px;font-family:'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif;color:#263238;word-break:keep-all;">
<tr><td style="padding:26px 24px 8px;">
  <div style="font-size:12px;font-weight:700;letter-spacing:.5px;color:#1565c0;">{escape(brand())}</div>
  <div style="margin-top:6px;font-size:22px;font-weight:800;line-height:1.35;">{escape(sub.name)}님 맞춤 입찰공고</div>
  <div style="margin-top:6px;font-size:14px;color:#546e7a;">{escape(date_label)} · 새 공고 <b style="color:#0d47a1;">{count}건</b>{f' · 마감 {URGENT_DAYS}일 이내 <b style="color:#c62828;">{urgent}건</b>' if urgent else ''}</div>
</td></tr>
<tr><td style="padding:8px 24px 8px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">
{''.join(parts)}
</table></td></tr>
<tr><td style="padding:18px 24px 26px;font-size:12px;line-height:1.7;color:#90a4ae;border-top:1px solid #eceff1;">
  수집 기간 {escape(window_label)} · 출처 조달청 나라장터(공공데이터포털 Open API)<br>
  참가자격·제출서류 등 세부 내용은 반드시 나라장터 공고 원문으로 확인하세요.<br>
  키워드 변경이나 수신 중단은 이 메일에 회신해 주세요{contact_line}.
</td></tr>
</table></td></tr></table></body></html>"""

    # ---------- 텍스트 ----------
    t: list[str] = [f"{sub.name}님 맞춤 입찰공고 — {date_label}", f"새 공고 {count}건" + (f", 마감임박 {urgent}건" if urgent else ""), ""]
    if sample:
        t += ["※ 샘플 메일입니다. 아래 공고는 가상의 데이터입니다.", ""]
    if errors:
        t += [f"※ {', '.join(KIND_NAMES.get(k, k) for k in errors)} 공고는 수집 오류로 빠졌습니다.", ""]
    if briefing and briefing.text:
        t += ["[오늘의 브리핑]", briefing.text, ""]
    if not matches:
        t += ["이번 수집 기간에는 조건에 맞는 새 공고가 없었습니다.", ""]
    if picks:
        t += ["[우선 검토 추천]"] + [_item_text(m, now) + "\n" for m in picks]
    if rest:
        t += ["[맞춤 공고]"] + [_item_text(m, now) + "\n" for m in rest]
    if count > len(shown):
        t.append(f"외 {count - len(shown)}건은 첨부 CSV를 확인하세요.")
    t += ["", f"수집 기간 {window_label} · 출처 조달청 나라장터", "세부 내용은 나라장터 공고 원문으로 확인하세요."]

    csv_bytes = build_csv(matches) if matches else None
    attachments = []
    if csv_bytes:
        attachments.append((f"입찰공고_{now_k:%Y%m%d}.csv", csv_bytes, "text/csv"))
    return Digest(
        subject=subject, html=html, text="\n".join(t), csv_bytes=csv_bytes,
        count=count, urgent=urgent, attachments=attachments,
    )
