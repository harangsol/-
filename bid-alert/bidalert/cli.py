"""명령줄 실행.

    python -m bidalert run                 # 고객 전원에게 오늘 메일 발송
    python -m bidalert run --dry-run       # 보내지 않고 out/ 폴더에 메일 파일만 생성
    python -m bidalert preview             # 가상 공고로 샘플 메일 생성(API 키 불필요)
    python -m bidalert check               # 설정·API 키 점검
"""

from __future__ import annotations

import argparse
import logging
import os
import re
import sys
from datetime import datetime, timedelta
from pathlib import Path

from . import ai
from .config import ConfigError, Subscriber, load_subscribers
from .digest import Digest, build_digest
from .matcher import select
from .models import KST, Notice
from .nara import BASE_URL, NaraApiError, NaraClient
from .sample import sample_notices
from .window import anchored_window, parse_kst

log = logging.getLogger("bidalert")
HERE = Path(__file__).resolve().parent.parent


def _slug(name: str) -> str:
    return re.sub(r"[^\w가-힣-]+", "_", name).strip("_") or "subscriber"


def write_files(out_dir: Path, sub: Subscriber, digest: Digest) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    base = out_dir / _slug(sub.name)
    base.with_suffix(".html").write_text(digest.html, encoding="utf-8")
    base.with_suffix(".txt").write_text(f"제목: {digest.subject}\n\n{digest.text}", encoding="utf-8")
    for filename, data, _ in digest.attachments:
        (out_dir / f"{_slug(sub.name)}_{filename}").write_bytes(data)
    return base.with_suffix(".html")


def collect(args, subs: list[Subscriber], start: datetime, end: datetime) -> tuple[list[Notice], dict[str, str]]:
    kinds = sorted({k for s in subs for k in s.kinds})
    if args.sample:
        return sample_notices(), {}
    key = os.environ.get("DATA_GO_KR_SERVICE_KEY", "")
    if not key:
        raise SystemExit("DATA_GO_KR_SERVICE_KEY 환경변수가 없습니다. 샘플로 보려면 --sample 을 붙이세요.")
    client = NaraClient(key, base_url=os.environ.get("DATA_GO_KR_BASE_URL") or BASE_URL)
    return client.fetch(kinds, start, end)


def cmd_run(args) -> int:
    try:
        subs = [s for s in load_subscribers(args.subscribers) if s.active]
    except ConfigError as e:
        log.error("%s", e)
        return 2
    if args.only:
        subs = [s for s in subs if s.name == args.only]
    if not subs:
        log.error("보낼 고객이 없습니다.")
        return 2

    now = datetime.now(KST)
    if args.start:
        start = parse_kst(args.start)
        end = parse_kst(args.end) if args.end else now
    else:
        start, end = anchored_window(now, args.anchor_hour)
    log.info("수집 기간: %s ~ %s", start.strftime("%Y-%m-%d %H:%M"), end.strftime("%Y-%m-%d %H:%M"))

    notices, errors = collect(args, subs, start, end)
    if errors and len(errors) == len({k for s in subs for k in s.kinds}):
        log.error("모든 업무구분 수집에 실패했습니다. 메일을 보내지 않습니다.")
        return 1
    log.info("공고 %d건 수집(중복 제거 후)", len(notices))

    dry = args.dry_run or args.sample
    mailer_ctx = None
    if not dry:
        from .mailer import MailConfigError, Mailer, SmtpSettings

        try:
            mailer_ctx = Mailer(SmtpSettings.from_env())
        except MailConfigError as e:
            log.error("%s", e)
            return 2

    failures = 0
    out_dir = Path(args.out)

    def process(mailer) -> None:
        nonlocal failures
        for sub in subs:
            matches = select(sub, notices, now)
            if not matches and args.skip_empty:
                log.info("%s: 맞는 공고 없음 — 건너뜀", sub.name)
                continue
            briefing = None
            if not args.no_ai:
                briefing = ai.make_briefing(sub, matches, now)
                if briefing is None and args.sample and sub.ai_summary:
                    from .sample import sample_briefing

                    briefing = sample_briefing()
                matches = ai.apply_briefing(matches, briefing)
            relevant_errors = {k: v for k, v in errors.items() if k in sub.kinds}
            digest = build_digest(
                sub, matches, now=now, window=(start, end), briefing=briefing,
                errors=relevant_errors, sample=args.sample,
            )
            if mailer is None:
                path = write_files(out_dir, sub, digest)
                log.info("%s: %d건 → %s", sub.name, digest.count, path)
                continue
            try:
                mailer.send(digest, sub.emails)
                log.info("%s: %d건 발송 (%s)", sub.name, digest.count, sub.masked_emails)
            except Exception as e:  # 한 고객 실패가 다른 고객 발송을 막지 않도록
                failures += 1
                log.error("%s: 발송 실패 — %s", sub.name, e)

    if mailer_ctx is None:
        process(None)
    else:
        with mailer_ctx as mailer:
            process(mailer)
    if errors:
        # 일부 구분 수집 실패: 메일은 나갔지만 실행을 실패로 표시해 운영자가 알 수 있게 한다.
        # 나중에 --start/--end 로 해당 기간을 다시 보내면 된다.
        log.error("일부 업무구분 수집 실패(%s). 같은 기간을 --start %s --end %s 로 다시 실행하세요.",
                  ", ".join(errors), start.strftime("%Y%m%d%H%M"), end.strftime("%Y%m%d%H%M"))
    return 1 if failures or errors else 0


def cmd_preview(args) -> int:
    args.sample = True
    args.dry_run = True
    if not args.subscribers_given:
        args.subscribers = str(HERE / "subscribers.example.toml")
    return cmd_run(args)


def cmd_check(args) -> int:
    ok = True
    try:
        subs = load_subscribers(args.subscribers)
        log.info("고객 설정 정상: %d명 (활성 %d명)", len(subs), sum(s.active for s in subs))
    except ConfigError as e:
        log.error("고객 설정 오류: %s", e)
        ok = False

    key = os.environ.get("DATA_GO_KR_SERVICE_KEY", "")
    if not key:
        log.error("DATA_GO_KR_SERVICE_KEY가 없습니다.")
        ok = False
    else:
        now = datetime.now(KST)
        try:
            client = NaraClient(key)
            items, total = client._get(
                "getBidPblancListInfoServcPPSSrch",
                {"pageNo": 1, "numOfRows": 1, "inqryDiv": 1,
                 "inqryBgnDt": (now - timedelta(days=1)).strftime("%Y%m%d%H%M"),
                 "inqryEndDt": now.strftime("%Y%m%d%H%M")},
            )
            log.info("나라장터 API 정상: 최근 24시간 용역 공고 %d건", total)
        except NaraApiError as e:
            log.error("나라장터 API 오류: %s", e)
            ok = False

    smtp_missing = [k for k in ("SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD") if not os.environ.get(k)]
    if smtp_missing:
        log.warning("메일 설정 없음(%s) — --dry-run 으로만 실행할 수 있습니다.", ", ".join(smtp_missing))
    log.info("AI 요약: %s", "사용" if ai.ai_available() else "꺼짐(ANTHROPIC_API_KEY 또는 anthropic 패키지 없음)")
    return 0 if ok else 1


def main(argv: list[str] | None = None) -> int:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s", datefmt="%H:%M:%S")
    p = argparse.ArgumentParser(prog="bidalert", description="나라장터 맞춤 입찰공고 알림")
    sub = p.add_subparsers(dest="cmd", required=True)

    def common(sp):
        sp.add_argument("--subscribers", default="subscribers.toml", help="고객 설정 TOML 경로")
        sp.add_argument("--out", default="out", help="--dry-run 결과를 저장할 폴더")
        sp.add_argument("--only", help="이 이름의 고객 한 명만 처리")
        sp.add_argument("--no-ai", action="store_true", help="AI 요약을 끈다")
        sp.add_argument("--skip-empty", action="store_true", help="맞는 공고가 없으면 메일을 보내지 않는다")
        sp.add_argument("--anchor-hour", type=int, default=7, help="수집 기준 시각(KST, 기본 7시)")
        sp.add_argument("--start", help="수집 시작 KST (예: 202611060700). 생략하면 직전 평일 기준 시각")
        sp.add_argument("--end", help="수집 끝 KST. 생략하면 지금")

    r = sub.add_parser("run", help="공고를 수집해 메일 발송")
    common(r)
    r.add_argument("--dry-run", action="store_true", help="보내지 않고 파일로만 저장")
    r.add_argument("--sample", action="store_true", help="API 대신 가상 공고 사용(자동으로 dry-run)")
    r.set_defaults(func=cmd_run)

    pv = sub.add_parser("preview", help="가상 공고로 샘플 메일 생성")
    common(pv)
    pv.set_defaults(func=cmd_preview)

    c = sub.add_parser("check", help="설정과 API 키 점검")
    c.add_argument("--subscribers", default="subscribers.toml")
    c.set_defaults(func=cmd_check)

    args = p.parse_args(argv)
    raw = argv if argv is not None else sys.argv[1:]
    args.subscribers_given = any(a.startswith("--subscribers") for a in raw)
    for name in ("sample", "dry_run"):
        if not hasattr(args, name):
            setattr(args, name, False)
    return args.func(args)
