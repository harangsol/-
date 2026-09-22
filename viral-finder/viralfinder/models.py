"""수집 대상 게시물의 공통 표현."""

from __future__ import annotations

import hashlib
import json
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Any


def _now() -> datetime:
    return datetime.now(timezone.utc)


def parse_ts(value: Any) -> datetime | None:
    """ISO8601 문자열 / epoch 초 / datetime 을 UTC datetime 으로 정규화한다."""
    if value is None or value == "":
        return None
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    if isinstance(value, (int, float)):
        return datetime.fromtimestamp(float(value), tz=timezone.utc)
    text = str(value).strip()
    if text.isdigit():
        return datetime.fromtimestamp(int(text), tz=timezone.utc)
    text = text.replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(text)
    except ValueError:
        for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d", "%Y/%m/%d"):
            try:
                parsed = datetime.strptime(text, fmt)
                break
            except ValueError:
                continue
        else:
            return None
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


@dataclass
class Post:
    """플랫폼 중립 게시물 레코드.

    조회수(views)는 인스타 릴스·스레드 모두 공개 노출이 들쭉날쭉하므로
    None 을 허용하고, 점수 계산 단계에서 별도로 처리한다.
    """

    platform: str                      # instagram | threads
    post_id: str
    url: str = ""
    author: str = ""
    author_followers: int | None = None
    caption: str = ""
    posted_at: datetime | None = None
    likes: int = 0
    comments: int = 0
    shares: int = 0
    saves: int = 0
    views: int | None = None
    media_type: str = ""               # reel | image | carousel | text ...
    hashtags: list[str] = field(default_factory=list)
    source: str = ""                   # 수집 경로 (apify-instagram 등)
    collected_at: datetime = field(default_factory=_now)
    raw: dict[str, Any] = field(default_factory=dict)

    # 계산 결과 (수집 시점에는 비어 있음)
    relevance: float = 0.0
    topics: list[str] = field(default_factory=list)
    matched_keywords: list[str] = field(default_factory=list)
    score: float = 0.0
    tier: str = ""
    score_parts: dict[str, float] = field(default_factory=dict)

    @property
    def key(self) -> str:
        return f"{self.platform}:{self.post_id}"

    @property
    def fingerprint(self) -> str:
        """캡션 기반 중복 판정용 해시 (같은 글을 여러 계정이 퍼간 경우 탐지)."""
        norm = "".join(ch for ch in self.caption if ch.isalnum())[:300]
        return hashlib.sha1(norm.encode("utf-8")).hexdigest() if norm else ""

    def age_hours_at(self, ref: datetime) -> float:
        """기준 시각 대비 경과 시간(h).

        배치 채점은 반드시 하나의 기준 시각을 공유해야 한다. 게시물마다
        now() 를 새로 읽으면 마이크로초 차이가 백분위에서 0 대 1 로 증폭된다.
        """
        if not self.posted_at:
            return 24.0 * 30
        return max((ref - self.posted_at).total_seconds() / 3600.0, 1.0)

    @property
    def age_hours(self) -> float:
        return self.age_hours_at(_now())

    @property
    def engagement(self) -> float:
        """댓글·공유·저장에 가중치를 둔 합산 반응량.

        좋아요는 손가락 하나, 댓글은 문장 하나, 저장은 '나중에 쓰겠다'는 의사다.
        정책자금·절세처럼 전환을 노리는 주제에선 저장·댓글이 훨씬 중요하다.
        """
        return (
            self.likes
            + self.comments * 3.0
            + self.shares * 4.0
            + self.saves * 5.0
        )

    @property
    def hook(self) -> str:
        """캡션 첫 줄 = 후킹 문장."""
        for line in self.caption.splitlines():
            line = line.strip()
            if line and not line.startswith("#"):
                return line
        return self.caption.strip()[:80]

    def to_row(self) -> dict[str, Any]:
        data = asdict(self)
        data["posted_at"] = self.posted_at.isoformat() if self.posted_at else None
        data["collected_at"] = self.collected_at.isoformat()
        data["hashtags"] = json.dumps(self.hashtags, ensure_ascii=False)
        data["topics"] = json.dumps(self.topics, ensure_ascii=False)
        data["matched_keywords"] = json.dumps(self.matched_keywords, ensure_ascii=False)
        data["score_parts"] = json.dumps(self.score_parts, ensure_ascii=False)
        data["raw"] = json.dumps(self.raw, ensure_ascii=False)
        return data

    @classmethod
    def from_row(cls, row: dict[str, Any]) -> "Post":
        data = dict(row)
        data.pop("key", None)
        data.pop("fingerprint", None)
        data["posted_at"] = parse_ts(data.get("posted_at"))
        data["collected_at"] = parse_ts(data.get("collected_at")) or _now()
        for jsonfield, default in (
            ("hashtags", []), ("topics", []), ("matched_keywords", []),
            ("score_parts", {}), ("raw", {}),
        ):
            value = data.get(jsonfield)
            if isinstance(value, str):
                try:
                    data[jsonfield] = json.loads(value)
                except (ValueError, TypeError):
                    data[jsonfield] = default
            elif value is None:
                data[jsonfield] = default
        allowed = set(cls.__dataclass_fields__)
        return cls(**{k: v for k, v in data.items() if k in allowed})
