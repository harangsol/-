"""주제 적합도 판정.

수집기가 해시태그로 긁어오면 '#재테크' 하나만 붙은 맛집 릴스까지 딸려온다.
캡션 본문을 키워드 사전에 대조해 걸러내는 단계가 반드시 필요하다.
"""

from __future__ import annotations

import re
from typing import Iterable

from .config import Config
from .models import Post

_SPACE = re.compile(r"\s+")


def normalize(text: str) -> str:
    """한글은 형태소 분석 없이 공백 제거 + 소문자화만으로 부분일치가 충분히 먹는다."""
    return _SPACE.sub("", (text or "").lower())


def _hits(haystack: str, needles: Iterable[str]) -> list[str]:
    return [n for n in needles if normalize(n) in haystack]


def evaluate(post: Post, config: Config) -> tuple[float, list[str], list[str]]:
    """(적합도 0.0~1.0, 매칭 주제, 매칭 키워드) 반환."""
    blob = normalize(post.caption + " " + " ".join(post.hashtags))
    if not blob:
        return 0.0, [], []

    if _hits(blob, config.negative):
        return 0.0, [], []

    topics: list[str] = []
    keywords: list[str] = []
    best = 0.0

    for name, spec in config.topics.items():
        core = _hits(blob, spec.get("core", []))
        support = _hits(blob, spec.get("support", []))
        if not core and not support:
            continue

        # 핵심어 1개 = 0.6, 2개 이상 = 0.85 / 보조어는 0.1씩 가산
        base = 0.0
        if core:
            base = 0.6 if len(core) == 1 else 0.85
        base += min(len(support), 3) * 0.1
        # 핵심어 없이 보조어만 있으면 약한 신호 (예: '재테크'만 있는 글)
        if not core:
            base = min(len(support), 3) * 0.12

        score = min(base * float(spec.get("weight", 1.0)), 1.0)
        if score >= 0.2:
            topics.append(name)
            keywords.extend(core + support)
        best = max(best, score)

    # 두 주제가 겹치면(예: 정책자금 + 절세) 타깃 적합도가 더 높다
    if len(topics) >= 2:
        best = min(best + 0.1, 1.0)

    seen, uniq = set(), []
    for k in keywords:
        if k not in seen:
            seen.add(k)
            uniq.append(k)
    return round(best, 3), topics, uniq[:12]


def annotate(posts: list[Post], config: Config) -> list[Post]:
    for post in posts:
        post.relevance, post.topics, post.matched_keywords = evaluate(post, config)
    return posts


def detect_hooks(text: str, config: Config) -> list[str]:
    """후킹 문장이 어떤 유형인지 태깅.

    한국어는 같은 표현이 '말 안 해주는' / '말안해주는' 으로 갈리므로
    원문과 공백 제거본 양쪽에 대조한다.
    """
    raw = text or ""
    squeezed = _SPACE.sub("", raw)
    found = []
    for label, pattern in config.hook_patterns.items():
        if re.search(pattern, raw) or re.search(pattern, squeezed):
            found.append(label)
    return found
