"""고객(구독자) 설정 읽기.

설정 파일은 TOML이며 고객 한 명이 [[subscriber]] 블록 하나다.
예시는 subscribers.example.toml 참고.
"""

from __future__ import annotations

import tomllib
from dataclasses import dataclass, field
from pathlib import Path

from .models import KIND_NAMES


class ConfigError(ValueError):
    pass


@dataclass
class Subscriber:
    name: str
    emails: list[str]
    keywords: list[str]
    kinds: list[str] = field(default_factory=lambda: ["servc", "thng"])
    exclude: list[str] = field(default_factory=list)
    orgs: list[str] = field(default_factory=list)
    regions: list[str] = field(default_factory=list)
    min_price: int = 0
    max_price: int = 0  # 0이면 상한 없음
    include_unpriced: bool = True  # 추정가격이 없는 공고도 받을지
    profile: str = ""  # AI 요약용 회사 소개
    ai_summary: bool = True
    active: bool = True

    @property
    def masked_emails(self) -> str:
        """로그에 남길 때 쓰는 가린 주소."""
        out = []
        for e in self.emails:
            user, _, domain = e.partition("@")
            out.append(f"{user[:2]}***@{domain}" if domain else "***")
        return ", ".join(out)


def _str_list(value, field_name: str, who: str) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        value = [value]
    if not isinstance(value, list) or not all(isinstance(v, str) for v in value):
        raise ConfigError(f"{who}: '{field_name}'는 문자열 목록이어야 합니다.")
    return [v.strip() for v in value if v.strip()]


def parse_subscribers(data: dict) -> list[Subscriber]:
    raw_list = data.get("subscriber", [])
    if not isinstance(raw_list, list) or not raw_list:
        raise ConfigError("[[subscriber]] 블록이 하나 이상 있어야 합니다.")
    subs = []
    for idx, raw in enumerate(raw_list, 1):
        who = f"{idx}번째 고객({raw.get('name', '이름 없음')})"
        name = str(raw.get("name", "")).strip()
        if not name:
            raise ConfigError(f"{who}: name이 비어 있습니다.")
        emails = _str_list(raw.get("email"), "email", who)
        if not emails:
            raise ConfigError(f"{who}: email이 비어 있습니다.")
        keywords = _str_list(raw.get("keywords"), "keywords", who)
        if not keywords:
            raise ConfigError(f"{who}: keywords가 비어 있습니다.")
        kinds = _str_list(raw.get("kinds", ["servc", "thng"]), "kinds", who)
        bad = [k for k in kinds if k not in KIND_NAMES]
        if bad:
            raise ConfigError(f"{who}: 알 수 없는 업무구분 {bad}. 사용 가능: {list(KIND_NAMES)}")
        try:
            min_price = int(raw.get("min_price", 0) or 0)
            max_price = int(raw.get("max_price", 0) or 0)
        except (TypeError, ValueError) as e:
            raise ConfigError(f"{who}: min_price/max_price는 원 단위 숫자여야 합니다.") from e
        if max_price and min_price > max_price:
            raise ConfigError(f"{who}: min_price가 max_price보다 큽니다.")
        subs.append(
            Subscriber(
                name=name,
                emails=emails,
                keywords=keywords,
                kinds=kinds,
                exclude=_str_list(raw.get("exclude"), "exclude", who),
                orgs=_str_list(raw.get("orgs"), "orgs", who),
                regions=_str_list(raw.get("regions"), "regions", who),
                min_price=min_price,
                max_price=max_price,
                include_unpriced=bool(raw.get("include_unpriced", True)),
                profile=str(raw.get("profile", "")).strip(),
                ai_summary=bool(raw.get("ai_summary", True)),
                active=bool(raw.get("active", True)),
            )
        )
    return subs


def load_subscribers(path: str | Path) -> list[Subscriber]:
    p = Path(path)
    if not p.exists():
        raise ConfigError(f"고객 설정 파일이 없습니다: {p}")
    try:
        data = tomllib.loads(p.read_text(encoding="utf-8"))
    except tomllib.TOMLDecodeError as e:
        raise ConfigError(f"{p}: TOML 형식 오류 — {e}") from e
    return parse_subscribers(data)
