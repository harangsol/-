"""설정 로딩."""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

PKG_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_CONFIG = PKG_ROOT / "config" / "keywords.json"
DEFAULT_DB = PKG_ROOT / "data" / "posts.db"


class Config:
    def __init__(self, data: dict[str, Any], path: Path | None = None):
        self.data = data
        self.path = path

    @classmethod
    def load(cls, path: str | Path | None = None) -> "Config":
        target = Path(path) if path else Path(os.environ.get("VF_CONFIG", DEFAULT_CONFIG))
        with open(target, encoding="utf-8") as fp:
            return cls(json.load(fp), target)

    @property
    def topics(self) -> dict[str, dict[str, Any]]:
        return self.data.get("topics", {})

    @property
    def negative(self) -> list[str]:
        return self.data.get("negative", [])

    @property
    def hook_patterns(self) -> dict[str, str]:
        return {k: v for k, v in self.data.get("hook_patterns", {}).items()
                if not k.startswith("_")}

    def seed_hashtags(self, topic: str | None = None) -> list[str]:
        out: list[str] = []
        for name, spec in self.topics.items():
            if topic and name != topic:
                continue
            out.extend(spec.get("seed_hashtags", []))
        seen, uniq = set(), []
        for tag in out:
            if tag not in seen:
                seen.add(tag)
                uniq.append(tag)
        return uniq
