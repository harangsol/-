"""Meta Instagram Graph API (공식 경로).

가능한 것 : 해시태그별 top_media / recent_media 조회 (좋아요·댓글 수까지)
불가능한 것: 타인 게시물의 조회수·저장수·팔로워 수, 스레드 키워드 검색

즉 공식 API 만으로는 '조회수 터진 릴스'를 직접 고를 수 없고,
좋아요·댓글 기반의 대리 지표까지만 얻을 수 있다. 한계를 알고 쓰자.

필요 조건:
  - 인스타 프로페셔널(비즈니스/크리에이터) 계정 + 연결된 페이스북 페이지
  - Meta 앱과 instagram_basic, instagram_manage_insights 권한
  - 환경변수 IG_USER_ID, IG_ACCESS_TOKEN
  - 쿼터: 7일 이동 기준 해시태그 30개
"""

from __future__ import annotations

import os

from ..models import Post, parse_ts
from .base import SourceError, as_int, first, register

GRAPH = "https://graph.facebook.com/v21.0"


def _creds() -> tuple[str, str]:
    user_id = os.environ.get("IG_USER_ID", "").strip()
    token = os.environ.get("IG_ACCESS_TOKEN", "").strip()
    if not user_id or not token:
        raise SourceError(
            "IG_USER_ID / IG_ACCESS_TOKEN 환경변수가 필요합니다. "
            "Meta 앱에서 인스타 프로페셔널 계정을 연결한 뒤 장기 토큰을 발급하세요."
        )
    return user_id, token


def _get(path: str, params: dict) -> dict:
    import requests

    try:
        resp = requests.get(f"{GRAPH}/{path}", params=params, timeout=30)
    except Exception as exc:
        raise SourceError(f"Graph API 호출 실패: {exc}") from exc
    data = resp.json() if resp.content else {}
    if resp.status_code >= 400:
        message = (data.get("error") or {}).get("message", resp.text[:200])
        raise SourceError(f"Graph API 오류 {resp.status_code}: {message}")
    return data


def hashtag_id(name: str) -> str | None:
    user_id, token = _creds()
    data = _get("ig_hashtag_search",
                {"user_id": user_id, "q": name.lstrip("#"), "access_token": token})
    items = data.get("data") or []
    return items[0]["id"] if items else None


@register("graph-hashtag")
def collect(queries: list[str], limit: int = 50, edge: str = "top_media", **_) -> list[Post]:
    """해시태그별 인기 게시물을 공식 API 로 수집한다.

    edge: top_media(인기) 또는 recent_media(최근 24시간)
    """
    user_id, token = _creds()
    fields = ("id,caption,media_type,media_url,permalink,timestamp,"
              "like_count,comments_count,children{media_type}")
    posts: list[Post] = []

    for query in queries:
        tag_id = hashtag_id(query)
        if not tag_id:
            continue
        data = _get(f"{tag_id}/{edge}", {
            "user_id": user_id, "fields": fields,
            "limit": min(limit, 50), "access_token": token,
        })
        for item in data.get("data", []):
            media_type = str(item.get("media_type", "")).lower()
            posts.append(Post(
                platform="instagram",
                post_id=str(item["id"]),
                url=item.get("permalink", ""),
                # Graph API 는 해시태그 검색 결과에 작성자를 돌려주지 않는다
                author="",
                caption=str(item.get("caption") or ""),
                posted_at=parse_ts(item.get("timestamp")),
                likes=as_int(first(item, "like_count")),
                comments=as_int(first(item, "comments_count")),
                media_type="reel" if media_type == "video" else media_type or "post",
                hashtags=[query.lstrip("#")],
                source="graph-hashtag",
                raw=item,
            ))
    return posts
