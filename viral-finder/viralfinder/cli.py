"""명령줄 인터페이스."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from .config import Config, DEFAULT_DB
from .models import Post
from .relevance import annotate, detect_hooks
from .report import markdown, terminal, to_csv
from .scoring import score_batch
from .sources import SourceError, get_source, list_sources
from .store import Store


def _dedupe(posts: list[Post]) -> list[Post]:
    """같은 글(키 일치) 및 동일 본문 재업로드(지문 일치)를 정리한다."""
    seen_keys: set[str] = set()
    seen_prints: dict[str, Post] = {}
    out: list[Post] = []
    for post in posts:
        if post.key in seen_keys:
            continue
        seen_keys.add(post.key)
        fp = post.fingerprint
        if fp and fp in seen_prints:
            kept = seen_prints[fp]
            # 같은 본문이면 반응이 큰 쪽만 남긴다
            if post.engagement <= kept.engagement:
                continue
            out.remove(kept)
        if fp:
            seen_prints[fp] = post
        out.append(post)
    return out


def cmd_collect(args) -> int:
    config = Config.load(args.config)
    queries = args.query or config.seed_hashtags(args.topic)
    if not queries and args.source not in ("sample", "file"):
        print("수집할 검색어가 없습니다. --query 또는 config 의 seed_hashtags 를 확인하세요.",
              file=sys.stderr)
        return 1

    collector = get_source(args.source)
    kwargs = {"queries": queries, "limit": args.limit}
    if args.file:
        kwargs["path"] = args.file
    if args.actor:
        kwargs["actor"] = args.actor
    if args.input_json:
        kwargs["input_json"] = args.input_json

    print(f"[수집] source={args.source} 검색어={len(queries)}개 limit={args.limit}")
    posts = collector(**kwargs)
    print(f"[수집] 원본 {len(posts)}건")

    if args.enrich_followers and args.source == "apify-instagram":
        from .sources.apify import enrich_followers
        filled = enrich_followers(posts)
        print(f"[보강] 팔로워 수 {filled}건 채움")

    posts = _dedupe(posts)
    annotate(posts, config)
    kept = [p for p in posts if p.relevance >= args.min_relevance]
    print(f"[필터] 적합도 {args.min_relevance} 이상 {len(kept)}건 "
          f"(제외 {len(posts) - len(kept)}건)")

    with Store(args.db) as store:
        new, updated = store.upsert(kept)
        print(f"[저장] 신규 {new}건 / 갱신 {updated}건 → {store.path}")
    return 0


def _load_ranked(args, config: Config) -> list[Post]:
    with Store(args.db) as store:
        posts = store.fetch(
            days=args.days, platform=args.platform, topic=args.topic,
            min_relevance=args.min_relevance,
        )
        if not posts:
            return []
        annotate(posts, config)
        score_batch(posts)
        store.save_scores(posts)
    return posts


def cmd_rank(args) -> int:
    config = Config.load(args.config)
    posts = _load_ranked(args, config)
    if not posts:
        print("조건에 맞는 게시물이 없습니다. 먼저 collect 를 실행하세요.")
        return 1
    print(terminal(posts, config, top=args.top))
    print(f"총 {len(posts)}건 중 상위 {min(args.top, len(posts))}건")
    return 0


def cmd_report(args) -> int:
    config = Config.load(args.config)
    posts = _load_ranked(args, config)
    if not posts:
        print("조건에 맞는 게시물이 없습니다. 먼저 collect 를 실행하세요.")
        return 1
    content = to_csv(posts[:args.top]) if args.format == "csv" else markdown(posts, config, args.top)
    if args.out:
        Path(args.out).parent.mkdir(parents=True, exist_ok=True)
        Path(args.out).write_text(content, encoding="utf-8")
        print(f"리포트 저장: {args.out} ({len(posts)}건 분석, 상위 {args.top}건 수록)")
    else:
        print(content)
    return 0


def cmd_hooks(args) -> int:
    config = Config.load(args.config)
    posts = _load_ranked(args, config)
    if not posts:
        print("데이터가 없습니다.")
        return 1
    from collections import Counter

    counts: Counter = Counter()
    for post in posts[:args.top]:
        counts.update(detect_hooks(post.hook, config))
    print(f"상위 {min(args.top, len(posts))}건의 후킹 유형 분포\n")
    for label, count in counts.most_common():
        bar = "█" * count
        print(f"  {label:<8} {count:>3}  {bar}")
    print("\n상위 후킹 문장")
    for idx, post in enumerate(posts[:args.top], 1):
        types = ",".join(detect_hooks(post.hook, config)) or "-"
        print(f"  {idx:>2}. [{types}] {post.hook[:70]}")
    return 0


def cmd_sources(args) -> int:
    print("사용 가능한 수집 소스:")
    for name in list_sources():
        print(f"  - {name}")
    return 0


def cmd_stats(args) -> int:
    with Store(args.db) as store:
        for key, value in store.stats().items():
            print(f"  {key:<12} {value}")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="viralfinder",
        description="정책자금·절세·저축 주제의 인스타 릴스/스레드 바이럴 글 탐지기",
    )
    parser.add_argument("--db", default=str(DEFAULT_DB), help="SQLite 경로")
    parser.add_argument("--config", default=None, help="키워드 설정 JSON 경로")
    sub = parser.add_subparsers(dest="command", required=True)

    common_filters = argparse.ArgumentParser(add_help=False)
    common_filters.add_argument("--days", type=int, default=90, help="최근 N일 (기본 90)")
    common_filters.add_argument("--platform", choices=["instagram", "threads"], default=None)
    common_filters.add_argument("--topic", default=None, help="정책자금 | 절세 | 저축")
    common_filters.add_argument("--min-relevance", type=float, default=0.3)
    common_filters.add_argument("--top", type=int, default=20)

    p = sub.add_parser("collect", help="게시물 수집")
    p.add_argument("--source", default="sample",
                   help="sample | apify-instagram | apify-threads | graph-hashtag | file")
    p.add_argument("--query", action="append", help="검색어/해시태그 (여러 번 지정 가능)")
    p.add_argument("--topic", default=None, help="config 의 seed_hashtags 중 해당 주제만 사용")
    p.add_argument("--limit", type=int, default=50, help="검색어당 최대 건수")
    p.add_argument("--file", default=None, help="file 소스용 CSV/JSON 경로")
    p.add_argument("--actor", default=None, help="Apify 액터 ID 덮어쓰기")
    p.add_argument("--input-json", default=None, help="Apify 입력 JSON 덮어쓰기")
    p.add_argument("--enrich-followers", action="store_true",
                   help="프로필 액터로 팔로워 수 보강 (Apify 비용 추가)")
    p.add_argument("--min-relevance", type=float, default=0.3,
                   help="이 값 미만은 저장하지 않음")
    p.set_defaults(func=cmd_collect)

    p = sub.add_parser("rank", parents=[common_filters], help="점수 계산 후 터미널 출력")
    p.set_defaults(func=cmd_rank)

    p = sub.add_parser("report", parents=[common_filters], help="마크다운/CSV 리포트 생성")
    p.add_argument("--format", choices=["md", "csv"], default="md")
    p.add_argument("--out", default=None, help="출력 파일 경로 (없으면 표준출력)")
    p.set_defaults(func=cmd_report)

    p = sub.add_parser("hooks", parents=[common_filters], help="후킹 문장 패턴 분석")
    p.set_defaults(func=cmd_hooks)

    p = sub.add_parser("sources", help="수집 소스 목록")
    p.set_defaults(func=cmd_sources)

    p = sub.add_parser("stats", help="저장소 현황")
    p.set_defaults(func=cmd_stats)
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        return args.func(args)
    except SourceError as exc:
        print(f"[수집 오류] {exc}", file=sys.stderr)
        return 2
    except KeyboardInterrupt:
        return 130
    except BrokenPipeError:  # head 등으로 파이프가 닫힌 경우
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
