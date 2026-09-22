"""리포트 출력 (터미널 / 마크다운 / CSV)."""

from __future__ import annotations

import csv
import io
from collections import Counter

from .config import Config
from .models import Post
from .relevance import detect_hooks
from .scoring import badges, engagement_rate, view_engagement_rate, view_multiple


def _num(value) -> str:
    if value is None:
        return "-"
    value = int(value)
    if value >= 10_000_000:
        return f"{value/10_000_000:.1f}천만"
    if value >= 10_000:
        return f"{value/10_000:.1f}만"
    return f"{value:,}"


def _age(post: Post) -> str:
    hours = post.age_hours
    if hours < 48:
        return f"{hours:.0f}시간"
    return f"{hours/24:.0f}일"


def terminal(posts: list[Post], config: Config, top: int = 20) -> str:
    out = io.StringIO()
    header = f"{'#':>3} {'점수':>5} {'등급':>3} {'플랫폼':<9} {'계정':<18} {'조회':>7} {'좋아요':>7} {'댓글':>6} {'반응률':>6} {'경과':>6}"
    out.write(header + "\n")
    out.write("-" * len(header) + "\n")
    for idx, post in enumerate(posts[:top], 1):
        rate = engagement_rate(post)
        out.write(
            f"{idx:>3} {post.score:>5.1f} {post.tier:>3} {post.platform:<9} "
            f"{(post.author or '-')[:18]:<18} {_num(post.views):>7} {_num(post.likes):>7} "
            f"{_num(post.comments):>6} {(f'{rate:.0f}%' if rate is not None else '-'):>6} {_age(post):>6}\n"
        )
        hook = post.hook[:70]
        tags = "/".join(post.topics) or "-"
        marks = ", ".join(badges(post))
        out.write(f"      [{tags}] {hook}\n")
        if marks:
            out.write(f"      ▸ {marks}\n")
        if post.url:
            out.write(f"      {post.url}\n")
        out.write("\n")
    return out.getvalue()


def markdown(posts: list[Post], config: Config, top: int = 30) -> str:
    out = io.StringIO()
    out.write("# 바이럴 콘텐츠 리포트\n\n")
    out.write(f"- 대상 게시물: {len(posts)}건 (상위 {min(top, len(posts))}건 표시)\n")
    by_platform = Counter(p.platform for p in posts)
    by_topic = Counter(t for p in posts for t in p.topics)
    out.write(f"- 플랫폼: {', '.join(f'{k} {v}건' for k, v in by_platform.items())}\n")
    out.write(f"- 주제: {', '.join(f'{k} {v}건' for k, v in by_topic.most_common())}\n\n")

    out.write("## 랭킹\n\n")
    out.write("| # | 점수 | 등급 | 플랫폼 | 계정 | 팔로워 | 조회수 | 좋아요 | 댓글 | 팔로워대비 | 조회대비 | 경과 | 주제 | 링크 |\n")
    out.write("| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n")
    for idx, post in enumerate(posts[:top], 1):
        rate = engagement_rate(post)
        vrate = view_engagement_rate(post)
        out.write(
            f"| {idx} | {post.score:.1f} | {post.tier} | {post.platform} | "
            f"{post.author or '-'} | {_num(post.author_followers)} | {_num(post.views)} | "
            f"{_num(post.likes)} | {_num(post.comments)} | "
            f"{f'{rate:.0f}%' if rate is not None else '-'} | "
            f"{f'{vrate:.1f}%' if vrate is not None else '-'} | {_age(post)} | "
            f"{'/'.join(post.topics) or '-'} | "
            f"{f'[열기]({post.url})' if post.url else '-'} |\n"
        )

    out.write("\n## 후킹 문장 분석\n\n")
    out.write("상위 글의 첫 문장과, 그 문장이 쓰는 후킹 유형이다. 그대로 베끼는 용도가 아니라 "
              "어떤 각도가 먹히는지 보는 용도다.\n\n")
    for idx, post in enumerate(posts[:top], 1):
        types = detect_hooks(post.hook, config)
        out.write(f"{idx}. **{post.hook}**\n")
        out.write(f"   - 유형: {', '.join(types) or '분류 없음'} · "
                  f"{post.platform} · {post.media_type or '-'} · 점수 {post.score:.1f}\n")
        marks = badges(post)
        if marks:
            out.write(f"   - 지표: {', '.join(marks)}\n")

    counts = Counter(t for post in posts[:top] for t in detect_hooks(post.hook, config))
    if counts:
        out.write("\n### 후킹 유형 빈도\n\n")
        out.write("| 유형 | 상위권 등장 |\n| --- | --- |\n")
        for label, count in counts.most_common():
            out.write(f"| {label} | {count} |\n")

    out.write("\n---\n\n")
    out.write("점수는 배치 내 상대 평가다. 속도(30) · 도달(25) · 팔로워 대비 이상치(20) · "
              "계정 자체 평균 대비 이상치(15) · 주제 적합도(10) 가중합을 100점으로 환산했다.\n")
    return out.getvalue()


def to_csv(posts: list[Post]) -> str:
    out = io.StringIO()
    writer = csv.writer(out)
    writer.writerow([
        "rank", "score", "tier", "platform", "author", "followers", "views",
        "likes", "comments", "shares", "saves", "engagement_rate_pct",
        "view_engagement_rate_pct", "view_multiple", "age_hours", "topics", "hook", "url", "posted_at",
    ])
    for idx, post in enumerate(posts, 1):
        rate = engagement_rate(post)
        vrate = view_engagement_rate(post)
        vmult = view_multiple(post)
        writer.writerow([
            idx, post.score, post.tier, post.platform, post.author,
            post.author_followers or "", post.views or "", post.likes, post.comments,
            post.shares, post.saves,
            f"{rate:.2f}" if rate is not None else "",
            f"{vrate:.2f}" if vrate is not None else "",
            f"{vmult:.2f}" if vmult is not None else "",
            f"{post.age_hours:.0f}", "/".join(post.topics), post.hook, post.url,
            post.posted_at.isoformat() if post.posted_at else "",
        ])
    return out.getvalue()
