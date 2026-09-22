"""SQLite 저장소.

같은 글을 여러 번 수집하면 지표가 갱신되도록 upsert 한다.
지표 변화 이력은 metric_history 에 쌓여, 나중에 '수집 이후 증가분'으로
진짜 지금 터지고 있는 글을 골라낼 수 있다.
"""

from __future__ import annotations

import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path

from .config import DEFAULT_DB
from .models import Post

SCHEMA = """
CREATE TABLE IF NOT EXISTS posts (
    key               TEXT PRIMARY KEY,
    platform          TEXT NOT NULL,
    post_id           TEXT NOT NULL,
    url               TEXT,
    author            TEXT,
    author_followers  INTEGER,
    caption           TEXT,
    posted_at         TEXT,
    likes             INTEGER DEFAULT 0,
    comments          INTEGER DEFAULT 0,
    shares            INTEGER DEFAULT 0,
    saves             INTEGER DEFAULT 0,
    views             INTEGER,
    media_type        TEXT,
    hashtags          TEXT,
    source            TEXT,
    collected_at      TEXT,
    raw               TEXT,
    relevance         REAL DEFAULT 0,
    topics            TEXT,
    matched_keywords  TEXT,
    score             REAL DEFAULT 0,
    tier              TEXT,
    score_parts       TEXT,
    fingerprint       TEXT
);
CREATE INDEX IF NOT EXISTS idx_posts_posted_at ON posts(posted_at);
CREATE INDEX IF NOT EXISTS idx_posts_score ON posts(score);
CREATE INDEX IF NOT EXISTS idx_posts_fingerprint ON posts(fingerprint);

CREATE TABLE IF NOT EXISTS metric_history (
    key         TEXT NOT NULL,
    seen_at     TEXT NOT NULL,
    likes       INTEGER,
    comments    INTEGER,
    views       INTEGER,
    PRIMARY KEY (key, seen_at)
);
"""

_COLUMNS = [
    "key", "platform", "post_id", "url", "author", "author_followers", "caption",
    "posted_at", "likes", "comments", "shares", "saves", "views", "media_type",
    "hashtags", "source", "collected_at", "raw", "relevance", "topics",
    "matched_keywords", "score", "tier", "score_parts", "fingerprint",
]


class Store:
    def __init__(self, path: str | Path | None = None):
        self.path = Path(path) if path else DEFAULT_DB
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(self.path)
        self.conn.row_factory = sqlite3.Row
        self.conn.executescript(SCHEMA)
        self.conn.commit()

    def close(self) -> None:
        self.conn.close()

    def __enter__(self) -> "Store":
        return self

    def __exit__(self, *exc) -> None:
        self.close()

    def upsert(self, posts: list[Post]) -> tuple[int, int]:
        """(신규, 갱신) 건수 반환."""
        new = updated = 0
        cur = self.conn.cursor()
        for post in posts:
            row = post.to_row()
            row["key"] = post.key
            row["fingerprint"] = post.fingerprint
            existing = cur.execute("SELECT key FROM posts WHERE key = ?", (post.key,)).fetchone()
            placeholders = ", ".join("?" for _ in _COLUMNS)
            assignments = ", ".join(f"{c}=excluded.{c}" for c in _COLUMNS if c != "key")
            cur.execute(
                f"INSERT INTO posts ({', '.join(_COLUMNS)}) VALUES ({placeholders}) "
                f"ON CONFLICT(key) DO UPDATE SET {assignments}",
                [row.get(c) for c in _COLUMNS],
            )
            cur.execute(
                "INSERT OR REPLACE INTO metric_history (key, seen_at, likes, comments, views) "
                "VALUES (?, ?, ?, ?, ?)",
                (post.key, post.collected_at.isoformat(), post.likes, post.comments, post.views),
            )
            if existing:
                updated += 1
            else:
                new += 1
        self.conn.commit()
        return new, updated

    def fetch(
        self,
        days: int | None = None,
        platform: str | None = None,
        topic: str | None = None,
        min_relevance: float = 0.0,
        limit: int | None = None,
    ) -> list[Post]:
        sql = "SELECT * FROM posts WHERE relevance >= ?"
        args: list = [min_relevance]
        if days:
            cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
            sql += " AND (posted_at IS NULL OR posted_at >= ?)"
            args.append(cutoff)
        if platform:
            sql += " AND platform = ?"
            args.append(platform)
        if topic:
            sql += " AND topics LIKE ?"
            args.append(f"%{topic}%")
        sql += " ORDER BY score DESC"
        if limit:
            sql += f" LIMIT {int(limit)}"
        rows = self.conn.execute(sql, args).fetchall()
        return [Post.from_row(dict(r)) for r in rows]

    def save_scores(self, posts: list[Post]) -> None:
        cur = self.conn.cursor()
        for post in posts:
            row = post.to_row()
            cur.execute(
                "UPDATE posts SET score=?, tier=?, score_parts=?, relevance=?, "
                "topics=?, matched_keywords=? WHERE key=?",
                (post.score, post.tier, row["score_parts"], post.relevance,
                 row["topics"], row["matched_keywords"], post.key),
            )
        self.conn.commit()

    def growth(self, key: str) -> dict[str, float] | None:
        """수집 이력이 2회 이상이면 시간당 증가분을 계산한다."""
        rows = self.conn.execute(
            "SELECT seen_at, likes, comments, views FROM metric_history "
            "WHERE key = ? ORDER BY seen_at", (key,)
        ).fetchall()
        if len(rows) < 2:
            return None
        first, last = rows[0], rows[-1]
        t0 = datetime.fromisoformat(first["seen_at"])
        t1 = datetime.fromisoformat(last["seen_at"])
        hours = max((t1 - t0).total_seconds() / 3600.0, 0.1)
        return {
            "hours": round(hours, 1),
            "likes_per_hour": round(((last["likes"] or 0) - (first["likes"] or 0)) / hours, 1),
            "views_per_hour": round(((last["views"] or 0) - (first["views"] or 0)) / hours, 1),
        }

    def stats(self) -> dict[str, int]:
        cur = self.conn.cursor()
        total = cur.execute("SELECT COUNT(*) FROM posts").fetchone()[0]
        by_platform = dict(cur.execute(
            "SELECT platform, COUNT(*) FROM posts GROUP BY platform").fetchall())
        relevant = cur.execute("SELECT COUNT(*) FROM posts WHERE relevance >= 0.5").fetchone()[0]
        return {"total": total, "relevant": relevant, **by_platform}
