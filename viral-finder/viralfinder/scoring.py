"""바이럴 점수 계산.

'터졌다'의 정의를 셋으로 쪼갠다.

1. 속도(velocity)   - 올라온 지 얼마 안 됐는데 반응이 몰렸는가
2. 도달(reach)      - 절대 조회수 자체가 큰가
3. 이상치(outlier)  - 팔로워 수 / 그 계정의 평소 성적 대비 유별나게 잘 됐는가

3번이 핵심이다. 팔로워 50만 계정의 좋아요 3천은 평타지만,
팔로워 2천 계정의 좋아요 3천은 알고리즘이 밀어준 글이다.
벤치마킹할 가치가 있는 건 후자다.
"""

from __future__ import annotations

import statistics
from collections import defaultdict
from datetime import datetime, timezone
from math import log10

from .models import Post

WEIGHTS = {
    "velocity": 0.30,
    "reach": 0.25,
    "follower_outlier": 0.20,
    "self_outlier": 0.15,
    "relevance": 0.10,
}

TIERS = ((80.0, "S"), (65.0, "A"), (50.0, "B"), (0.0, "C"))

# 계정 자체 기준선을 계산하려면 같은 작성자의 글이 최소 이만큼 필요하다
MIN_POSTS_FOR_SELF_BASELINE = 3


def _log(value: float) -> float:
    # 소수점 아래 잔여 오차는 백분위에서 동점을 깨뜨리므로 잘라낸다
    return round(log10(max(value, 0.0) + 1.0), 9)


def _percentiles(values: list[float]) -> list[float]:
    """값 리스트를 0~1 백분위로 변환 (동점은 평균 순위)."""
    n = len(values)
    if n == 0:
        return []
    if n == 1:
        return [0.5]
    order = sorted(range(n), key=lambda i: values[i])
    ranks = [0.0] * n
    i = 0
    while i < n:
        j = i
        while j + 1 < n and values[order[j + 1]] == values[order[i]]:
            j += 1
        avg_rank = (i + j) / 2.0
        for k in range(i, j + 1):
            ranks[order[k]] = avg_rank / (n - 1)
        i = j + 1
    return ranks


def _self_baselines(posts: list[Post]) -> dict[str, float]:
    grouped: dict[str, list[float]] = defaultdict(list)
    for post in posts:
        if post.author:
            grouped[post.author].append(post.engagement)
    return {
        author: statistics.median(vals)
        for author, vals in grouped.items()
        if len(vals) >= MIN_POSTS_FOR_SELF_BASELINE and statistics.median(vals) > 0
    }


def engagement_rate(post: Post) -> float | None:
    """팔로워 대비 반응률(%). 팔로워 정보가 없으면 None.

    표시용 지표이므로 가중치 없는 원본 합계를 쓴다. 점수 계산에 쓰는
    Post.engagement 는 댓글·저장에 가중치가 붙어 있어 수치가 부풀려진다.
    바이럴 릴스는 팔로워 밖으로 퍼지기 때문에 100%를 넘기도 한다.
    """
    if not post.author_followers:
        return None
    raw = post.likes + post.comments + post.shares + post.saves
    return raw / post.author_followers * 100.0


def view_engagement_rate(post: Post) -> float | None:
    """조회수 대비 반응률(%). 릴스 품질은 이쪽이 더 정직하다 (통상 2~6%)."""
    if not post.views:
        return None
    raw = post.likes + post.comments + post.shares + post.saves
    return raw / post.views * 100.0


def view_multiple(post: Post) -> float | None:
    """팔로워 대비 조회수 배수. 1.0 초과면 팔로워 밖으로 퍼진 글."""
    if not post.views or not post.author_followers:
        return None
    return post.views / post.author_followers


def score_batch(posts: list[Post]) -> list[Post]:
    """배치 내 상대 평가로 0~100 점수를 매긴다.

    절대 기준을 고정하지 않는 이유: 정책자금 릴스의 '잘 된 수치'와
    저축 스레드의 그것은 자릿수가 다르다. 같이 모아 놓고 비교하는 편이
    임의의 상수를 박아 넣는 것보다 정직하다.
    """
    if not posts:
        return posts

    now = datetime.now(timezone.utc)
    baselines = _self_baselines(posts)

    velocity_raw, reach_raw = [], []
    follower_raw: list[float | None] = []
    self_raw: list[float | None] = []

    for post in posts:
        age = min(post.age_hours_at(now), 24 * 90)
        velocity_raw.append(_log(post.engagement / age))
        reach_raw.append(_log(post.views if post.views else post.engagement * 25))

        rate = engagement_rate(post)
        vmult = view_multiple(post)
        if rate is None and vmult is None:
            follower_raw.append(None)
        else:
            follower_raw.append(_log((rate or 0.0) * 2.0 + (vmult or 0.0) * 10.0))

        base = baselines.get(post.author)
        self_raw.append(_log(post.engagement / base * 10.0) if base else None)

    pct_velocity = _percentiles(velocity_raw)
    pct_reach = _percentiles(reach_raw)
    pct_follower = _sparse_percentiles(follower_raw)
    pct_self = _sparse_percentiles(self_raw)

    for idx, post in enumerate(posts):
        parts: dict[str, float] = {
            "velocity": pct_velocity[idx],
            "reach": pct_reach[idx],
            "relevance": post.relevance,
        }
        if pct_follower[idx] is not None:
            parts["follower_outlier"] = pct_follower[idx]
        if pct_self[idx] is not None:
            parts["self_outlier"] = pct_self[idx]

        total_weight = sum(WEIGHTS[name] for name in parts)
        raw = sum(WEIGHTS[name] * value for name, value in parts.items())
        post.score = round(raw / total_weight * 100.0, 1) if total_weight else 0.0
        post.score_parts = {k: round(v, 3) for k, v in parts.items()}
        post.tier = next(tier for threshold, tier in TIERS if post.score >= threshold)

    posts.sort(key=lambda p: p.score, reverse=True)
    return posts


def _sparse_percentiles(values: list[float | None]) -> list[float | None]:
    """None 이 섞인 리스트는 존재하는 값끼리만 백분위를 매긴다."""
    present = [(i, v) for i, v in enumerate(values) if v is not None]
    if not present:
        return [None] * len(values)
    pct = _percentiles([v for _, v in present])
    out: list[float | None] = [None] * len(values)
    for (idx, _), p in zip(present, pct):
        out[idx] = p
    return out


def badges(post: Post) -> list[str]:
    """사람이 한눈에 읽을 절대 지표 뱃지."""
    out = []
    if post.views and post.views >= 1_000_000:
        out.append("조회수 100만+")
    elif post.views and post.views >= 100_000:
        out.append("조회수 10만+")
    rate = engagement_rate(post)
    if rate is not None and rate >= 5:
        out.append(f"팔로워 대비 반응 {rate:.0f}%")
    vrate = view_engagement_rate(post)
    if vrate is not None and vrate >= 5:
        out.append(f"조회수 대비 반응 {vrate:.1f}%")
    vmult = view_multiple(post)
    if vmult is not None and vmult >= 10:
        out.append(f"팔로워 대비 {vmult:.0f}배 도달")
    if post.comments >= 300:
        out.append(f"댓글 {post.comments:,}")
    if post.saves and post.saves >= 500:
        out.append(f"저장 {post.saves:,}")
    if post.age_hours <= 72 and post.engagement >= 1000:
        out.append("3일 내 급상승")
    return out
