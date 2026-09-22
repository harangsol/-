"""오프라인 데모 소스.

API 키 없이 파이프라인(수집 → 적합도 → 점수 → 리포트)이 실제로 도는지
확인하기 위한 합성 데이터다. 실재하는 게시물이 아니다.
"""

from __future__ import annotations

from ..config import PKG_ROOT
from .base import register
from .csv_import import collect as collect_file

SAMPLE_PATH = PKG_ROOT / "data" / "sample_posts.json"


@register("sample")
def collect(queries: list[str] | None = None, **_):
    posts = collect_file(path=str(SAMPLE_PATH))
    for post in posts:
        post.source = "sample(합성데이터)"
    return posts
