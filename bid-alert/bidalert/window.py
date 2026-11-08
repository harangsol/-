"""수집 기간 계산.

매일 같은 시각(기본 07:00 KST)을 기준점으로 [직전 평일 07:00, 오늘 07:00) 구간을 수집한다.
실행이 몇 분 늦어져도 구간이 기준점에 고정돼 있어 공고가 빠지거나 두 번 가지 않는다.
월요일에는 금요일 07:00부터 주말 공고까지 한 번에 받는다.
"""

from __future__ import annotations

from datetime import datetime, timedelta

from .models import KST


def anchored_window(now: datetime, anchor_hour: int = 7) -> tuple[datetime, datetime]:
    now_k = now.astimezone(KST)
    end = now_k.replace(hour=anchor_hour, minute=0, second=0, microsecond=0)
    if now_k < end:
        end -= timedelta(days=1)
    start = end - timedelta(days=1)
    while start.weekday() >= 5:  # 토·일이면 금요일까지 거슬러 간다
        start -= timedelta(days=1)
    return start, end


def parse_kst(text: str) -> datetime:
    """'202611090700' 또는 '2026-11-09 07:00' 형식을 KST datetime으로."""
    for fmt in ("%Y%m%d%H%M", "%Y-%m-%d %H:%M", "%Y%m%d", "%Y-%m-%d"):
        try:
            return datetime.strptime(text.strip(), fmt).replace(tzinfo=KST)
        except ValueError:
            continue
    raise ValueError(f"날짜 형식을 알 수 없습니다: {text!r} (예: 202611090700)")
