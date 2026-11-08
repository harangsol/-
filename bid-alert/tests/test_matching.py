import unittest
from datetime import datetime, timedelta

from bidalert.config import ConfigError, Subscriber, parse_subscribers
from bidalert.matcher import match_notice, select
from bidalert.models import KST, Notice, format_won, parse_amount, parse_datetime
from bidalert.window import anchored_window, parse_kst

NOW = datetime(2026, 11, 9, 7, 5, tzinfo=KST)  # 월요일


def notice(title, kind="servc", price=100_000_000, days=5, region="", org="가람시", ord_="000"):
    return Notice(
        kind=kind, bid_no=title[:6], bid_ord=ord_, title=title, org=org, price=price,
        close_at=NOW + timedelta(days=days), region_limit=region,
    )


def sub(**kw):
    base = dict(name="테스트", emails=["a@b.c"], keywords=["홈페이지"], kinds=["servc", "thng"])
    base.update(kw)
    return Subscriber(**base)


class MatcherTest(unittest.TestCase):
    def test_whitespace_and_case_insensitive(self):
        s = sub(keywords=["홈페이지 구축", "ums"])
        self.assertIsNotNone(match_notice(s, notice("가람시 홈페이지구축 용역"), NOW))
        self.assertIsNotNone(match_notice(s, notice("통합메시지(UMS) 운영"), NOW))

    def test_and_keyword(self):
        s = sub(keywords=["앱+유지보수"])
        self.assertIsNotNone(match_notice(s, notice("모바일 앱 유지보수"), NOW))
        self.assertIsNone(match_notice(s, notice("모바일 앱 구축"), NOW))

    def test_exclude_wins(self):
        s = sub(keywords=["홈페이지"], exclude=["청소"])
        self.assertIsNone(match_notice(s, notice("홈페이지 및 청소 용역"), NOW))

    def test_kind_filter(self):
        self.assertIsNone(match_notice(sub(), notice("홈페이지 공사", kind="cnstwk"), NOW))

    def test_closed_notice_skipped(self):
        self.assertIsNone(match_notice(sub(), notice("홈페이지", days=-1), NOW))
        self.assertIsNotNone(match_notice(sub(), notice("홈페이지", days=-1), NOW, include_closed=True))

    def test_price_range(self):
        s = sub(min_price=50_000_000, max_price=200_000_000)
        self.assertIsNone(match_notice(s, notice("홈페이지", price=10_000_000), NOW))
        self.assertIsNone(match_notice(s, notice("홈페이지", price=900_000_000), NOW))
        self.assertIsNotNone(match_notice(s, notice("홈페이지", price=150_000_000), NOW))

    def test_unpriced(self):
        self.assertIsNotNone(match_notice(sub(min_price=1), notice("홈페이지", price=None), NOW))
        self.assertIsNone(match_notice(sub(include_unpriced=False), notice("홈페이지", price=None), NOW))

    def test_region(self):
        s = sub(regions=["경기"])
        self.assertIsNotNone(match_notice(s, notice("홈페이지", region=""), NOW))  # 제한 없음
        self.assertIsNotNone(match_notice(s, notice("홈페이지", region="경기도"), NOW))
        self.assertIsNone(match_notice(s, notice("홈페이지", region="전라남도"), NOW))

    def test_org_filter(self):
        s = sub(orgs=["교육청"])
        self.assertIsNone(match_notice(s, notice("홈페이지", org="가람시"), NOW))
        self.assertIsNotNone(match_notice(s, notice("홈페이지", org="한빛시 교육청"), NOW))

    def test_select_orders_by_score_then_deadline(self):
        s = sub(keywords=["홈페이지", "유지보수"])
        out = select(
            s,
            [
                notice("홈페이지 구축", days=9),
                notice("홈페이지 유지보수", days=9),
                notice("유지보수 홈페이지 웹", days=2),  # 2개 + 마감임박 가산
            ],
            NOW,
        )
        self.assertEqual([m.notice.title for m in out], ["유지보수 홈페이지 웹", "홈페이지 유지보수", "홈페이지 구축"])


class ConfigTest(unittest.TestCase):
    def test_parse_ok(self):
        subs = parse_subscribers(
            {"subscriber": [{"name": "A", "email": "a@x.kr", "keywords": ["웹"], "kinds": ["servc"]}]}
        )
        self.assertEqual(subs[0].emails, ["a@x.kr"])
        self.assertEqual(subs[0].masked_emails, "a***@x.kr")

    def test_errors(self):
        bad = [
            {},
            {"subscriber": [{"email": "a@x", "keywords": ["x"]}]},
            {"subscriber": [{"name": "A", "keywords": ["x"]}]},
            {"subscriber": [{"name": "A", "email": "a@x"}]},
            {"subscriber": [{"name": "A", "email": "a@x", "keywords": ["x"], "kinds": ["foo"]}]},
            {"subscriber": [{"name": "A", "email": "a@x", "keywords": ["x"], "min_price": 9, "max_price": 1}]},
        ]
        for data in bad:
            with self.assertRaises(ConfigError):
                parse_subscribers(data)

    def test_example_file_is_valid(self):
        from pathlib import Path

        from bidalert.config import load_subscribers

        subs = load_subscribers(Path(__file__).resolve().parent.parent / "subscribers.example.toml")
        self.assertGreaterEqual(len(subs), 1)


class WindowTest(unittest.TestCase):
    def test_monday_covers_weekend(self):
        start, end = anchored_window(datetime(2026, 11, 9, 7, 20, tzinfo=KST))  # 월 07:20
        self.assertEqual(end, datetime(2026, 11, 9, 7, 0, tzinfo=KST))
        self.assertEqual(start, datetime(2026, 11, 6, 7, 0, tzinfo=KST))  # 금요일

    def test_tuesday(self):
        start, end = anchored_window(datetime(2026, 11, 10, 9, 0, tzinfo=KST))
        self.assertEqual((start.day, end.day), (9, 10))

    def test_before_anchor_uses_previous_day(self):
        start, end = anchored_window(datetime(2026, 11, 10, 6, 30, tzinfo=KST))  # 화 06:30
        self.assertEqual(end, datetime(2026, 11, 9, 7, 0, tzinfo=KST))
        self.assertEqual(start.weekday(), 4)

    def test_consecutive_runs_do_not_overlap(self):
        a = anchored_window(datetime(2026, 11, 10, 7, 30, tzinfo=KST))
        b = anchored_window(datetime(2026, 11, 11, 7, 30, tzinfo=KST))
        self.assertEqual(a[1], b[0])

    def test_parse_kst(self):
        self.assertEqual(parse_kst("202611090700"), datetime(2026, 11, 9, 7, 0, tzinfo=KST))
        with self.assertRaises(ValueError):
            parse_kst("어제")


class ModelTest(unittest.TestCase):
    def test_parse_datetime(self):
        for s in ("2026-11-09 10:00:00", "2026-11-09 10:00", "202611091000", "2026/11/09 10:00"):
            self.assertEqual(parse_datetime(s), datetime(2026, 11, 9, 10, 0, tzinfo=KST), s)
        self.assertIsNone(parse_datetime(""))
        self.assertIsNone(parse_datetime("미정"))

    def test_parse_amount(self):
        self.assertEqual(parse_amount("123,000,000"), 123_000_000)
        self.assertEqual(parse_amount("98000000.0"), 98_000_000)
        self.assertIsNone(parse_amount(""))
        self.assertIsNone(parse_amount("0"))

    def test_format_won(self):
        self.assertEqual(format_won(320_000_000), "3억 2,000만원")
        self.assertEqual(format_won(100_000_000), "1억원")
        self.assertEqual(format_won(34_500_000), "3,450만원")
        self.assertEqual(format_won(5_000), "5,000원")
        self.assertEqual(format_won(None), "금액 미공개")

    def test_from_api(self):
        n = Notice.from_api(
            {"bidNtceNo": "R1", "bidNtceOrd": "001", "bidNtceNm": " 제목 ", "presmptPrce": "",
             "asignBdgtAmt": "55000000", "bidClseDt": "2026-11-12 10:00:00"},
            "servc",
        )
        self.assertEqual(n.title, "제목")
        self.assertEqual(n.amount, 55_000_000)  # 추정가격이 없으면 배정예산
        self.assertEqual(n.key, "R1-001")
        self.assertEqual(n.days_left(NOW), 3)


if __name__ == "__main__":
    unittest.main()
