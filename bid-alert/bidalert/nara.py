"""조달청 나라장터 입찰공고정보서비스(공공데이터포털) 클라이언트.

규격 근거: 공공데이터포털 '조달청_나라장터 입찰공고정보서비스'(데이터번호 15129394).
- 기본 주소: https://apis.data.go.kr/1230000/ad/BidPublicInfoService
- 목록 조회: getBidPblancListInfo{Servc,Thng,Cnstwk,Frgcpt}PPSSrch
- inqryDiv=1(공고게시일시) + inqryBgnDt/inqryEndDt(YYYYMMDDHHMM), 조회창 최대 약 31일
- numOfRows 최대 100, type=json
- 응답: response.header.resultCode ("00" 정상, "03" 데이터 없음, "30" 미등록 키)
        response.body.items (배열 · {"item": [...]} · 단건 객체 · 빈 문자열 모두 가능)
"""

from __future__ import annotations

import json
import logging
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta
from typing import Callable, Iterable

from .models import KIND_NAMES, KST, Notice

log = logging.getLogger(__name__)

BASE_URL = "https://apis.data.go.kr/1230000/ad/BidPublicInfoService"
OPERATIONS = {
    "servc": "getBidPblancListInfoServcPPSSrch",
    "thng": "getBidPblancListInfoThngPPSSrch",
    "cnstwk": "getBidPblancListInfoCnstwkPPSSrch",
    "frgcpt": "getBidPblancListInfoFrgcptPPSSrch",
}
MAX_WINDOW = timedelta(days=31)
PAGE_SIZE = 100

# 결과코드별 안내 메시지. 확인된 코드만 적는다.
RESULT_HINTS = {
    "30": "등록되지 않은 서비스키입니다. 공공데이터포털에서 '조달청_나라장터 입찰공고정보서비스' "
    "활용신청이 승인됐는지, Decoding 키를 넣었는지 확인하세요.",
}


class NaraApiError(RuntimeError):
    def __init__(self, code: str, message: str, *, retryable: bool = False):
        hint = RESULT_HINTS.get(code)
        super().__init__(f"[{code or '?'}] {message}" + (f" — {hint}" if hint else ""))
        self.code = code
        self.retryable = retryable


Fetcher = Callable[[str, float], str]


def _http_get(url: str, timeout: float) -> str:
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        retryable = e.code == 429 or e.code >= 500
        raise NaraApiError("", f"HTTP {e.code}", retryable=retryable) from e
    except (urllib.error.URLError, TimeoutError, ConnectionError) as e:
        raise NaraApiError("", f"네트워크 오류: {e}", retryable=True) from e


def normalize_service_key(key: str) -> str:
    """Encoding 키(%2B 등 포함)를 넣어도 이중 인코딩되지 않도록 원본 키로 되돌린다."""
    key = key.strip()
    if "%" in key:
        key = urllib.parse.unquote(key)
    return key


def _normalize_items(items: object) -> list[dict]:
    if isinstance(items, list):
        return [i for i in items if isinstance(i, dict)]
    if isinstance(items, dict):
        inner = items.get("item")
        if isinstance(inner, list):
            return [i for i in inner if isinstance(i, dict)]
        if isinstance(inner, dict):
            return [inner]
    return []


def parse_response(text: str) -> tuple[list[dict], int]:
    """응답 본문을 (item 목록, totalCount)로 해석한다. 오류면 NaraApiError."""
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        # 인증 오류 등은 JSON 대신 XML로 온다.
        code = re.search(r"<returnReasonCode>(\d+)</returnReasonCode>", text)
        msg = re.search(r"<returnAuthMsg>([^<]*)</returnAuthMsg>", text)
        if code:
            if code.group(1) in ("00", "03"):
                return [], 0
            raise NaraApiError(code.group(1), msg.group(1) if msg else "인증/요청 오류")
        raise NaraApiError("", f"JSON이 아닌 응답: {text.strip()[:200]}")

    response = data.get("response", {}) if isinstance(data, dict) else {}
    header = response.get("header", {}) or {}
    code = str(header.get("resultCode", "")).strip()
    if code == "03":
        return [], 0
    if code not in ("00", "0"):
        raise NaraApiError(code, str(header.get("resultMsg") or "알 수 없는 오류"))
    body = response.get("body", {}) or {}
    try:
        total = int(body.get("totalCount") or 0)
    except (TypeError, ValueError):
        total = 0
    return _normalize_items(body.get("items")), total


def split_windows(start: datetime, end: datetime) -> list[tuple[datetime, datetime]]:
    """API 조회창 제한(31일)에 맞게 기간을 나눈다."""
    windows = []
    cursor = start
    while cursor < end:
        nxt = min(cursor + MAX_WINDOW, end)
        windows.append((cursor, nxt))
        cursor = nxt
    return windows


class NaraClient:
    def __init__(
        self,
        service_key: str,
        *,
        base_url: str = BASE_URL,
        timeout: float = 30.0,
        retries: int = 2,
        fetcher: Fetcher | None = None,
        sleep: Callable[[float], None] = time.sleep,
    ):
        if not service_key:
            raise ValueError("DATA_GO_KR_SERVICE_KEY가 비어 있습니다.")
        self.service_key = normalize_service_key(service_key)
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.retries = retries
        self.fetcher = fetcher or _http_get
        self.sleep = sleep

    def _url(self, operation: str, params: dict) -> str:
        query = urllib.parse.urlencode({**params, "serviceKey": self.service_key, "type": "json"})
        return f"{self.base_url}/{operation}?{query}"

    def _get(self, operation: str, params: dict) -> tuple[list[dict], int]:
        url = self._url(operation, params)
        for attempt in range(self.retries + 1):
            try:
                return parse_response(self.fetcher(url, self.timeout))
            except NaraApiError as e:
                if not e.retryable or attempt == self.retries:
                    raise
                delay = 2 ** attempt
                log.warning("%s 재시도 %d/%d (%ss 후): %s", operation, attempt + 1, self.retries, delay, e)
                self.sleep(delay)
        raise AssertionError("unreachable")

    def fetch_kind(self, kind: str, start: datetime, end: datetime, *, max_pages: int = 100) -> list[Notice]:
        """[start, end) 기간에 게시된 공고를 받는다. API는 분 단위 양끝 포함이라 끝은 1분 당겨 묻는다."""
        operation = OPERATIONS[kind]
        notices: list[Notice] = []
        for w_start, w_end in split_windows(start, end):
            page = 1
            while page <= max_pages:
                params = {
                    "pageNo": page,
                    "numOfRows": PAGE_SIZE,
                    "inqryDiv": 1,
                    "inqryBgnDt": w_start.astimezone(KST).strftime("%Y%m%d%H%M"),
                    "inqryEndDt": (w_end - timedelta(minutes=1)).astimezone(KST).strftime("%Y%m%d%H%M"),
                }
                items, total = self._get(operation, params)
                notices.extend(Notice.from_api(i, kind) for i in items)
                if not items or page * PAGE_SIZE >= total:
                    break
                page += 1
            else:
                log.warning("%s: 최대 %d페이지까지만 받았습니다. 기간을 나눠 다시 받으세요.", KIND_NAMES[kind], max_pages)
        return notices

    def fetch(self, kinds: Iterable[str], start: datetime, end: datetime) -> tuple[list[Notice], dict[str, str]]:
        """여러 업무구분을 받아 합친다. 일부 구분이 실패해도 나머지는 돌려주고 실패 내역을 함께 준다."""
        notices: list[Notice] = []
        errors: dict[str, str] = {}
        for kind in kinds:
            try:
                got = self.fetch_kind(kind, start, end)
                log.info("%s 공고 %d건 수집", KIND_NAMES[kind], len(got))
                notices.extend(got)
            except NaraApiError as e:
                log.error("%s 공고 수집 실패: %s", KIND_NAMES[kind], e)
                errors[kind] = str(e)
        return dedupe(notices), errors


def dedupe(notices: Iterable[Notice]) -> list[Notice]:
    """같은 공고번호는 차수가 가장 높은(최신 정정) 공고 하나만 남긴다."""
    best: dict[tuple[str, str], Notice] = {}
    for n in notices:
        k = (n.kind, n.bid_no)
        cur = best.get(k)
        if cur is None or (n.bid_ord or "") > (cur.bid_ord or ""):
            best[k] = n
    return list(best.values())
