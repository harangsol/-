import json
import unittest
import urllib.parse
from datetime import datetime, timedelta

from bidalert.models import KST
from bidalert.nara import NaraApiError, NaraClient, dedupe, normalize_service_key, parse_response, split_windows


def envelope(items, total=None, code="00"):
    return json.dumps(
        {
            "response": {
                "header": {"resultCode": code, "resultMsg": "정상"},
                "body": {"items": items, "totalCount": total if total is not None else (len(items) if isinstance(items, list) else 1), "pageNo": 1},
            }
        },
        ensure_ascii=False,
    )


ITEM = {"bidNtceNo": "R26BK00000001", "bidNtceOrd": "000", "bidNtceNm": "홈페이지 유지보수"}


class ParseResponseTest(unittest.TestCase):
    def test_list_items(self):
        items, total = parse_response(envelope([ITEM, ITEM], total=2))
        self.assertEqual(len(items), 2)
        self.assertEqual(total, 2)

    def test_nested_item_list(self):
        items, _ = parse_response(envelope({"item": [ITEM]}, total=1))
        self.assertEqual(items[0]["bidNtceNm"], "홈페이지 유지보수")

    def test_single_item_object(self):
        items, _ = parse_response(envelope({"item": ITEM}, total=1))
        self.assertEqual(len(items), 1)

    def test_empty_string_items(self):
        items, total = parse_response(envelope("", total=0))
        self.assertEqual(items, [])
        self.assertEqual(total, 0)

    def test_no_data_code(self):
        self.assertEqual(parse_response(envelope([], code="03")), ([], 0))

    def test_unregistered_key_has_hint(self):
        with self.assertRaises(NaraApiError) as ctx:
            parse_response(envelope([], code="30"))
        self.assertEqual(ctx.exception.code, "30")
        self.assertIn("활용신청", str(ctx.exception))
        self.assertFalse(ctx.exception.retryable)

    def test_xml_auth_error(self):
        xml = (
            "<OpenAPI_ServiceResponse><cmmMsgHeader><returnAuthMsg>SERVICE_KEY_IS_NOT_REGISTERED_ERROR"
            "</returnAuthMsg><returnReasonCode>30</returnReasonCode></cmmMsgHeader></OpenAPI_ServiceResponse>"
        )
        with self.assertRaises(NaraApiError) as ctx:
            parse_response(xml)
        self.assertEqual(ctx.exception.code, "30")

    def test_garbage(self):
        with self.assertRaises(NaraApiError):
            parse_response("<html>gateway error</html>")


class ClientTest(unittest.TestCase):
    def setUp(self):
        self.start = datetime(2026, 11, 6, 7, 0, tzinfo=KST)
        self.end = datetime(2026, 11, 9, 7, 0, tzinfo=KST)

    def test_paginates_until_total(self):
        calls = []

        def fetcher(url, timeout):
            q = urllib.parse.parse_qs(urllib.parse.urlparse(url).query)
            calls.append(q)
            page = int(q["pageNo"][0])
            n = 100 if page < 3 else 50
            items = [dict(ITEM, bidNtceNo=f"P{page}-{i}") for i in range(n)]
            return envelope(items, total=250)

        client = NaraClient("abc", fetcher=fetcher)
        notices = client.fetch_kind("servc", self.start, self.end)
        self.assertEqual(len(notices), 250)
        self.assertEqual(len(calls), 3)
        q = calls[0]
        self.assertEqual(q["inqryBgnDt"], ["202611060700"])
        self.assertEqual(q["inqryEndDt"], ["202611090659"])  # 끝 시각은 1분 당겨 묻는다
        self.assertEqual(q["inqryDiv"], ["1"])
        self.assertEqual(q["type"], ["json"])
        self.assertEqual(q["numOfRows"], ["100"])
        self.assertTrue(all(n.kind == "servc" for n in notices))

    def test_service_key_encoded_once(self):
        seen = {}

        def fetcher(url, timeout):
            seen["url"] = url
            return envelope([], total=0)

        decoded = "ab+c/d=="
        NaraClient(urllib.parse.quote(decoded, safe=""), fetcher=fetcher).fetch_kind("thng", self.start, self.end)
        q = urllib.parse.parse_qs(urllib.parse.urlparse(seen["url"]).query)
        self.assertEqual(q["serviceKey"], [decoded])
        self.assertNotIn("%25", seen["url"])  # 이중 인코딩 흔적이 없어야 한다
        self.assertEqual(normalize_service_key(" ab+c "), "ab+c")

    def test_retries_retryable_errors(self):
        attempts = []

        def fetcher(url, timeout):
            attempts.append(1)
            if len(attempts) == 1:
                raise NaraApiError("", "HTTP 503", retryable=True)
            return envelope([ITEM], total=1)

        client = NaraClient("k", fetcher=fetcher, sleep=lambda s: None)
        self.assertEqual(len(client.fetch_kind("servc", self.start, self.end)), 1)
        self.assertEqual(len(attempts), 2)

    def test_does_not_retry_auth_error(self):
        attempts = []

        def fetcher(url, timeout):
            attempts.append(1)
            return envelope([], code="30")

        client = NaraClient("k", fetcher=fetcher, sleep=lambda s: None)
        with self.assertRaises(NaraApiError):
            client.fetch_kind("servc", self.start, self.end)
        self.assertEqual(len(attempts), 1)

    def test_partial_failure_reported(self):
        def fetcher(url, timeout):
            if "Thng" in url:
                return envelope([], code="99")
            return envelope([ITEM], total=1)

        notices, errors = NaraClient("k", fetcher=fetcher).fetch(["servc", "thng"], self.start, self.end)
        self.assertEqual(len(notices), 1)
        self.assertIn("thng", errors)

    def test_empty_key_rejected(self):
        with self.assertRaises(ValueError):
            NaraClient("")


class HelpersTest(unittest.TestCase):
    def test_split_windows(self):
        start = datetime(2026, 1, 1, tzinfo=KST)
        windows = split_windows(start, start + timedelta(days=70))
        self.assertEqual(len(windows), 3)
        self.assertEqual(windows[0][1], windows[1][0])
        self.assertEqual(windows[-1][1], start + timedelta(days=70))
        self.assertTrue(all(b - a <= timedelta(days=31) for a, b in windows))

    def test_dedupe_keeps_latest_order(self):
        from bidalert.models import Notice

        a = Notice(kind="servc", bid_no="X1", bid_ord="000", title="원공고")
        b = Notice(kind="servc", bid_no="X1", bid_ord="001", title="정정공고")
        c = Notice(kind="thng", bid_no="X1", bid_ord="000", title="다른 구분")
        out = dedupe([a, b, c])
        self.assertEqual(len(out), 2)
        self.assertIn("정정공고", [n.title for n in out])


if __name__ == "__main__":
    unittest.main()
