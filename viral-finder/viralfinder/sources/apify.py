"""Apify 액터를 통한 수집.

인스타그램과 스레드는 공개 검색 API 를 제공하지 않는다(README 참고).
현실적으로 자동 수집이 가능한 경로는 Apify 같은 스크래핑 플랫폼의
관리형 액터를 호출하는 것이고, 이 모듈이 그 래퍼다.

액터 ID 와 입력 스키마는 Apify 스토어에서 바뀔 수 있으므로
환경변수 / CLI 인자로 덮어쓸 수 있게 열어 두었다.
"""

from __future__ import annotations

import json
import os

from ..models import Post, parse_ts
from .base import SourceError, as_int, first, register

API_BASE = "https://api.apify.com/v2/acts/{actor}/run-sync-get-dataset-items"

DEFAULT_ACTORS = {
    "instagram_hashtag": "apify~instagram-hashtag-scraper",
    "instagram_profile": "apify~instagram-profile-scraper",
    "threads": "curious_coder~threads-scraper",
}


def _token() -> str:
    token = os.environ.get("APIFY_TOKEN", "").strip()
    if not token:
        raise SourceError(
            "APIFY_TOKEN 환경변수가 없습니다. https://console.apify.com/account/integrations "
            "에서 발급 후 `export APIFY_TOKEN=...` 하세요."
        )
    return token


def run_actor(actor: str, payload: dict, timeout: int = 600) -> list[dict]:
    import requests

    url = API_BASE.format(actor=actor)
    try:
        resp = requests.post(
            url,
            params={"token": _token(), "timeout": timeout, "format": "json"},
            json=payload,
            timeout=timeout + 30,
        )
    except Exception as exc:  # 네트워크 계층 오류
        raise SourceError(f"Apify 호출 실패 ({actor}): {exc}") from exc

    if resp.status_code >= 400:
        raise SourceError(
            f"Apify 응답 {resp.status_code} ({actor}): {resp.text[:300]}\n"
            "액터 ID 또는 입력 스키마가 바뀌었을 수 있습니다. --actor / --input-json 으로 덮어쓰세요."
        )
    try:
        items = resp.json()
    except ValueError as exc:
        raise SourceError(f"Apify 응답이 JSON 이 아닙니다: {resp.text[:200]}") from exc
    return items if isinstance(items, list) else [items]


def map_instagram(item: dict, source: str) -> Post | None:
    post_id = first(item, "id", "shortCode", "shortcode", "code")
    if not post_id:
        return None
    media_type = str(first(item, "type", "productType", "mediaType", default="")).lower()
    if "clips" in media_type or "video" in media_type:
        media_type = "reel"
    return Post(
        platform="instagram",
        post_id=str(post_id),
        url=first(item, "url", "postUrl",
                  default=f"https://www.instagram.com/p/{first(item, 'shortCode', 'shortcode', default=post_id)}/"),
        author=str(first(item, "ownerUsername", "username", "owner_username", default="")),
        author_followers=as_int(first(item, "ownerFollowersCount", "followersCount",
                                      "owner_followers_count"), None) or None,
        caption=str(first(item, "caption", "text", "edge_media_to_caption", default="")),
        posted_at=parse_ts(first(item, "timestamp", "takenAt", "taken_at_timestamp", "createTime")),
        likes=as_int(first(item, "likesCount", "likes", "like_count")),
        comments=as_int(first(item, "commentsCount", "comments", "comment_count")),
        views=as_int(first(item, "videoPlayCount", "videoViewCount", "playCount",
                           "view_count"), None) or None,
        media_type=media_type or "post",
        hashtags=list(item.get("hashtags") or []),
        source=source,
        raw=item,
    )


def map_threads(item: dict, source: str) -> Post | None:
    post_id = first(item, "id", "pk", "code", "postId")
    if not post_id:
        return None
    user = item.get("user") or item.get("owner") or {}
    if not isinstance(user, dict):
        user = {}
    return Post(
        platform="threads",
        post_id=str(post_id),
        url=str(first(item, "url", "permalink", "postUrl", default="")),
        author=str(first(item, "username", "ownerUsername", default=user.get("username", ""))),
        author_followers=as_int(first(item, "followersCount", "userFollowersCount",
                                      default=user.get("follower_count")), None) or None,
        caption=str(first(item, "text", "caption", "content", default="")),
        posted_at=parse_ts(first(item, "taken_at", "timestamp", "publishedAt", "createdAt")),
        likes=as_int(first(item, "likeCount", "like_count", "likes")),
        comments=as_int(first(item, "replyCount", "reply_count", "commentsCount", "comments")),
        shares=as_int(first(item, "repostCount", "repost_count", "reshareCount")),
        views=as_int(first(item, "viewCount", "view_count", "impressions"), None) or None,
        media_type="text",
        hashtags=list(item.get("hashtags") or []),
        source=source,
        raw=item,
    )


@register("apify-instagram")
def collect_instagram(
    queries: list[str],
    limit: int = 50,
    actor: str | None = None,
    input_json: str | None = None,
    **_,
) -> list[Post]:
    """해시태그 단위로 인스타 게시물/릴스를 수집한다."""
    actor = actor or os.environ.get("VF_APIFY_IG_ACTOR") or DEFAULT_ACTORS["instagram_hashtag"]
    payload = {
        "hashtags": [q.lstrip("#") for q in queries],
        "resultsLimit": limit,
    }
    if input_json:
        payload.update(json.loads(input_json))
    items = run_actor(actor, payload)
    posts = [map_instagram(i, "apify-instagram") for i in items]
    return [p for p in posts if p]


@register("apify-threads")
def collect_threads(
    queries: list[str],
    limit: int = 50,
    actor: str | None = None,
    input_json: str | None = None,
    **_,
) -> list[Post]:
    """검색어 단위로 스레드 글을 수집한다."""
    actor = actor or os.environ.get("VF_APIFY_THREADS_ACTOR") or DEFAULT_ACTORS["threads"]
    payload = {
        "queries": queries,
        "search": queries[0] if queries else "",
        "resultsLimit": limit,
        "maxItems": limit,
    }
    if input_json:
        payload.update(json.loads(input_json))
    items = run_actor(actor, payload)
    posts = [map_threads(i, "apify-threads") for i in items]
    return [p for p in posts if p]


def enrich_followers(posts: list[Post], actor: str | None = None) -> int:
    """팔로워 수를 프로필 액터로 보강한다.

    팔로워 대비 이상치가 이 도구 점수의 핵심이므로, 해시태그 수집만으로
    팔로워 수가 비어 있으면 랭킹 품질이 눈에 띄게 떨어진다.
    """
    actor = actor or os.environ.get("VF_APIFY_PROFILE_ACTOR") or DEFAULT_ACTORS["instagram_profile"]
    targets = sorted({p.author for p in posts
                      if p.platform == "instagram" and p.author and not p.author_followers})
    if not targets:
        return 0
    items = run_actor(actor, {"usernames": targets})
    lookup: dict[str, int] = {}
    for item in items:
        name = str(first(item, "username", "ownerUsername", default="")).lower()
        count = as_int(first(item, "followersCount", "followers_count", "followers"), 0)
        if name and count:
            lookup[name] = count
    filled = 0
    for post in posts:
        count = lookup.get((post.author or "").lower())
        if count and not post.author_followers:
            post.author_followers = count
            filled += 1
    return filled
