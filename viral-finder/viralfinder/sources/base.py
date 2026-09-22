from __future__ import annotations

from typing import Callable

from ..models import Post


class SourceError(RuntimeError):
    """수집 실패 (인증, 네트워크, 응답 형식 등)."""


_REGISTRY: dict[str, Callable[..., list[Post]]] = {}


def register(name: str):
    def deco(fn):
        _REGISTRY[name] = fn
        return fn
    return deco


def get_source(name: str) -> Callable[..., list[Post]]:
    from . import apify, csv_import, graph_api, sample  # noqa: F401  (등록 트리거)

    if name not in _REGISTRY:
        raise SourceError(
            f"알 수 없는 소스 '{name}'. 사용 가능: {', '.join(sorted(_REGISTRY))}"
        )
    return _REGISTRY[name]


def list_sources() -> list[str]:
    from . import apify, csv_import, graph_api, sample  # noqa: F401

    return sorted(_REGISTRY)


def as_int(value, default=0):
    try:
        if value is None or value == "":
            return default
        return int(float(value))
    except (TypeError, ValueError):
        return default


def first(data: dict, *keys, default=None):
    """여러 후보 키 중 먼저 값이 있는 것을 반환 (액터마다 필드명이 다르다)."""
    for key in keys:
        if key in data and data[key] not in (None, ""):
            return data[key]
    return default
