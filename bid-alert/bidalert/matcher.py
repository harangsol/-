"""고객 조건에 맞는 공고 고르기.

키워드 규칙
- 공백은 무시한다: "홈페이지 구축"은 "홈페이지구축"에도 걸린다.
- 대소문자를 구분하지 않는다.
- "+"로 묶으면 모두 들어 있어야 한다: "유지보수+홈페이지"
- exclude에 걸리면 키워드가 맞아도 뺀다.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import datetime

from .config import Subscriber
from .models import Notice

_WS = re.compile(r"\s+")


def _norm(text: str) -> str:
    return _WS.sub("", text).lower()


def _hit(term: str, haystack: str) -> bool:
    parts = [_norm(p) for p in term.split("+") if p.strip()]
    return bool(parts) and all(p in haystack for p in parts)


@dataclass
class Match:
    notice: Notice
    keywords: list[str]
    score: float
    ai_reason: str = ""
    ai_pick: bool = False


def match_notice(sub: Subscriber, n: Notice, now: datetime, include_closed: bool = False) -> Match | None:
    if n.kind not in sub.kinds:
        return None
    if n.close_at and n.close_at < now and not include_closed:
        return None  # 이미 마감

    title = _norm(n.title)
    if any(_hit(x, title) for x in sub.exclude):
        return None
    hits = [k for k in sub.keywords if _hit(k, title)]
    if not hits:
        return None

    if sub.orgs:
        orgs = _norm(n.org + " " + n.demand_org)
        if not any(_norm(o) in orgs for o in sub.orgs):
            return None

    if sub.regions and n.region_limit:
        # 지역 제한이 없는 공고(전국)는 통과, 제한이 있으면 고객 지역이 들어 있어야 한다.
        region = _norm(n.region_limit)
        if not any(_norm(r) in region for r in sub.regions):
            return None

    amount = n.amount
    if amount is None:
        if not sub.include_unpriced:
            return None
    else:
        if sub.min_price and amount < sub.min_price:
            return None
        if sub.max_price and amount > sub.max_price:
            return None

    # 점수: 맞은 키워드 수가 우선, 마감이 가까울수록 약간 가산
    score = float(len(hits))
    days = n.days_left(now)
    if days is not None and 0 <= days <= 3:
        score += 0.5
    return Match(notice=n, keywords=hits, score=score)


def select(sub: Subscriber, notices: list[Notice], now: datetime, include_closed: bool = False) -> list[Match]:
    matches = [m for n in notices if (m := match_notice(sub, n, now, include_closed))]
    far = datetime.max.replace(tzinfo=now.tzinfo)
    matches.sort(key=lambda m: (-m.score, m.notice.close_at or far, m.notice.title))
    return matches
