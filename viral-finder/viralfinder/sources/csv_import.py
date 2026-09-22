"""CSV / JSON 수동 반입.

자동 수집이 막히거나(로그인 요구, 액터 비용) 손으로 모은 목록이 있을 때 쓴다.
컬럼명은 한글/영문 모두 인식한다.
"""

from __future__ import annotations

import csv
import json
from pathlib import Path

from ..models import Post, parse_ts
from .base import SourceError, as_int, first, register

ALIASES = {
    "platform": ["platform", "플랫폼"],
    "post_id": ["post_id", "id", "아이디"],
    "url": ["url", "link", "permalink", "링크", "주소"],
    "author": ["author", "username", "계정", "작성자"],
    "author_followers": ["author_followers", "followers", "팔로워", "팔로워수"],
    "caption": ["caption", "text", "본문", "내용", "캡션"],
    "posted_at": ["posted_at", "timestamp", "date", "작성일", "게시일"],
    "likes": ["likes", "like_count", "좋아요"],
    "comments": ["comments", "comment_count", "댓글"],
    "shares": ["shares", "리포스트", "공유"],
    "saves": ["saves", "저장"],
    "views": ["views", "view_count", "play_count", "조회수", "재생수"],
    "media_type": ["media_type", "type", "형식"],
    "hashtags": ["hashtags", "해시태그"],
}


def _pick(row: dict, field: str, default=None):
    lowered = {str(k).strip().lower(): v for k, v in row.items()}
    for alias in ALIASES[field]:
        if alias.lower() in lowered and lowered[alias.lower()] not in (None, ""):
            return lowered[alias.lower()]
    return default


def _to_post(row: dict, source: str) -> Post | None:
    url = _pick(row, "url", "")
    post_id = _pick(row, "post_id") or (str(url).rstrip("/").split("/")[-1] if url else None)
    if not post_id:
        return None
    platform = str(_pick(row, "platform", "")).lower()
    if not platform:
        platform = "threads" if "threads.net" in str(url) or "threads.com" in str(url) else "instagram"
    tags = _pick(row, "hashtags", "")
    if isinstance(tags, str):
        tags = [t.strip().lstrip("#") for t in tags.replace(",", " ").split() if t.strip()]
    return Post(
        platform=platform,
        post_id=str(post_id),
        url=str(url or ""),
        author=str(_pick(row, "author", "") or ""),
        author_followers=as_int(_pick(row, "author_followers"), None) or None,
        caption=str(_pick(row, "caption", "") or ""),
        posted_at=parse_ts(_pick(row, "posted_at")),
        likes=as_int(_pick(row, "likes")),
        comments=as_int(_pick(row, "comments")),
        shares=as_int(_pick(row, "shares")),
        saves=as_int(_pick(row, "saves")),
        views=as_int(_pick(row, "views"), None) or None,
        media_type=str(_pick(row, "media_type", "") or ""),
        hashtags=list(tags or []),
        source=source,
        raw=dict(row),
    )


@register("file")
def collect(queries: list[str] | None = None, path: str | None = None, **_) -> list[Post]:
    if not path:
        raise SourceError("--file 로 CSV 또는 JSON 경로를 지정하세요.")
    target = Path(path)
    if not target.exists():
        raise SourceError(f"파일을 찾을 수 없습니다: {target}")

    if target.suffix.lower() == ".json":
        data = json.loads(target.read_text(encoding="utf-8"))
        rows = data if isinstance(data, list) else data.get("items", [])
    else:
        with open(target, encoding="utf-8-sig", newline="") as fp:
            rows = list(csv.DictReader(fp))

    posts = [_to_post(r, f"file:{target.name}") for r in rows]
    return [p for p in posts if p]
