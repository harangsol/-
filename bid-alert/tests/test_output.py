import json
import unittest
from datetime import datetime, timedelta
from types import SimpleNamespace

from bidalert import ai
from bidalert.config import Subscriber
from bidalert.digest import build_digest
from bidalert.mailer import SmtpSettings, build_message
from bidalert.matcher import Match, select
from bidalert.models import KST, Notice
from bidalert.sample import sample_notices

NOW = datetime(2026, 11, 9, 7, 5, tzinfo=KST)
WINDOW = (NOW - timedelta(days=3), NOW)
SUB = Subscriber(name="하랑솔루션", emails=["a@x.kr"], keywords=["홈페이지", "UMS", "<b>"], kinds=["servc", "thng"])

try:
    import anthropic  # noqa: F401

    HAS_SDK = True
except ImportError:
    HAS_SDK = False


def m(title, key_no="N1", url="", days=5):
    n = Notice(kind="servc", bid_no=key_no, bid_ord="000", title=title, org="가람시", price=1_000,
               close_at=NOW + timedelta(days=days), url=url)
    return Match(notice=n, keywords=["홈페이지"], score=1)


class DigestTest(unittest.TestCase):
    def test_escapes_external_text(self):
        d = build_digest(SUB, [m("<script>alert(1)</script> 홈페이지", url="javascript:alert(1)")], now=NOW, window=WINDOW)
        self.assertNotIn("<script>", d.html)
        self.assertIn("&lt;script&gt;", d.html)
        self.assertNotIn("javascript:", d.html)

    def test_links_only_http(self):
        d = build_digest(SUB, [m("홈페이지", url="https://www.g2b.go.kr/x?a=1&b=2")], now=NOW, window=WINDOW)
        self.assertIn('href="https://www.g2b.go.kr/x?a=1&amp;b=2"', d.html)

    def test_subject_counts_urgent(self):
        d = build_digest(SUB, [m("홈페이지", days=1), m("홈페이지 2", key_no="N2", days=9)], now=NOW, window=WINDOW)
        self.assertIn("2건", d.subject)
        self.assertIn("마감임박 1건", d.subject)
        self.assertEqual(d.urgent, 1)

    def test_closed_notice_label_not_urgent(self):
        d = build_digest(SUB, [m("홈페이지", days=-2)], now=NOW, window=WINDOW)
        self.assertIn("마감됨", d.html)
        self.assertEqual(d.urgent, 0)

    def test_empty_digest(self):
        d = build_digest(SUB, [], now=NOW, window=WINDOW)
        self.assertIn("조건에 맞는 새 공고가 없었습니다", d.html)
        self.assertEqual(d.attachments, [])

    def test_csv_has_bom_and_all_rows(self):
        matches = [m(f"홈페이지 {i}", key_no=f"N{i}") for i in range(75)]
        d = build_digest(SUB, matches, now=NOW, window=WINDOW)
        name, data, mime = d.attachments[0]
        self.assertTrue(data.startswith(b"\xef\xbb\xbf"))
        self.assertEqual(data.decode("utf-8-sig").count("\n"), 76)  # 헤더 + 75행
        self.assertIn("외 15건", d.html)  # 본문은 60건까지
        self.assertEqual(mime, "text/csv")

    def test_sample_banner_and_errors(self):
        d = build_digest(SUB, [m("홈페이지")], now=NOW, window=WINDOW, sample=True, errors={"thng": "x"})
        self.assertIn("가상의 데이터", d.html)
        self.assertIn("물품 공고는", d.html)
        self.assertTrue(d.subject.startswith("[샘플]"))

    def test_sample_pipeline(self):
        sub = Subscriber(name="A", emails=["a@x"], keywords=["홈페이지", "누리집"], exclude=["청소"])
        out = select(sub, sample_notices(NOW), NOW)
        self.assertTrue(out)
        self.assertTrue(all("청소" not in x.notice.title for x in out))


class MailTest(unittest.TestCase):
    def test_build_message(self):
        d = build_digest(SUB, [m("홈페이지")], now=NOW, window=WINDOW)
        settings = SmtpSettings("smtp.x", 587, "u@x.kr", "pw", "starttls", "u@x.kr", "입찰 알림", "help@x.kr")
        msg = build_message(d, ["a@x.kr", "b@x.kr"], settings)
        self.assertEqual(msg["To"], "a@x.kr, b@x.kr")
        self.assertEqual(msg["Reply-To"], "help@x.kr")
        types = [p.get_content_type() for p in msg.walk()]
        self.assertIn("text/plain", types)
        self.assertIn("text/html", types)
        self.assertIn("text/csv", types)


class BriefingTest(unittest.TestCase):
    def matches(self):
        return [m("홈페이지 A", "A"), m("홈페이지 B", "B"), m("홈페이지 C", "C"), m("홈페이지 D", "D")]

    def test_parse_filters_unknown_keys_and_caps(self):
        text = json.dumps({"briefing": "총평", "picks": [
            {"key": "ZZZ-000", "reason": "없는 공고"},
            {"key": "D-000", "reason": "d"}, {"key": "B-000", "reason": "b"},
            {"key": "A-000", "reason": "a"}, {"key": "C-000", "reason": "c"},
        ]}, ensure_ascii=False)
        b = ai.parse_briefing(text, {x.notice.key for x in self.matches()})
        self.assertEqual(list(b.picks), ["D-000", "B-000", "A-000"])

    def test_parse_bad_json(self):
        self.assertIsNone(ai.parse_briefing("not json", set()))

    def test_apply_moves_picks_first_in_order(self):
        b = ai.Briefing(text="t", picks={"C-000": "c", "A-000": "a"})
        out = ai.apply_briefing(self.matches(), b)
        self.assertEqual([x.notice.bid_no for x in out], ["C", "A", "B", "D"])
        self.assertTrue(out[0].ai_pick)
        self.assertEqual(out[0].ai_reason, "c")

    def test_user_message_contains_profile_and_rows(self):
        sub = Subscriber(name="A", emails=["a@x"], keywords=["홈페이지"], profile="웹 전문 회사")
        msg = ai.build_user_message(sub, self.matches(), NOW)
        self.assertIn("웹 전문 회사", msg)
        self.assertIn('"key": "A-000"', msg)

    def test_no_matches_skips(self):
        self.assertIsNone(ai.make_briefing(SUB, [], NOW, client=object()))

    @unittest.skipUnless(HAS_SDK, "anthropic 패키지 없음")
    def test_make_briefing_request_shape(self):
        captured = {}

        class FakeMessages:
            def create(self, **kw):
                captured.update(kw)
                body = json.dumps({"briefing": "오늘은 2건", "picks": [{"key": "A-000", "reason": "규모 적합"}]})
                return SimpleNamespace(stop_reason="end_turn", content=[SimpleNamespace(type="text", text=body)])

        client = SimpleNamespace(beta=SimpleNamespace(messages=FakeMessages()))
        b = ai.make_briefing(SUB, self.matches(), NOW, client=client)
        self.assertEqual(b.picks, {"A-000": "규모 적합"})
        self.assertEqual(captured["model"], "claude-opus-5-5")
        self.assertEqual(captured["fallbacks"], "default")
        self.assertIn("server-side-fallback-2026-07-01", captured["betas"])
        self.assertEqual(captured["output_config"]["format"]["type"], "json_schema")

    @unittest.skipUnless(HAS_SDK, "anthropic 패키지 없음")
    def test_refusal_returns_none(self):
        class FakeMessages:
            def create(self, **kw):
                return SimpleNamespace(stop_reason="refusal", content=[])

        client = SimpleNamespace(beta=SimpleNamespace(messages=FakeMessages()))
        self.assertIsNone(ai.make_briefing(SUB, self.matches(), NOW, client=client))


if __name__ == "__main__":
    unittest.main()
