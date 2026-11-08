"""입찰공고 데이터 모델."""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone

KST = timezone(timedelta(hours=9), "KST")

# 업무구분 코드 → 한글 이름
KIND_NAMES = {
    "servc": "용역",
    "thng": "물품",
    "cnstwk": "공사",
    "frgcpt": "외자",
}

_DATE_FORMATS = (
    "%Y-%m-%d %H:%M:%S",
    "%Y-%m-%d %H:%M",
    "%Y/%m/%d %H:%M:%S",
    "%Y/%m/%d %H:%M",
    "%Y%m%d%H%M%S",
    "%Y%m%d%H%M",
    "%Y-%m-%d",
    "%Y%m%d",
)


def parse_datetime(value: object) -> datetime | None:
    """나라장터 응답의 일시 문자열을 KST datetime으로 바꾼다. 형식이 달라도 최대한 해석한다."""
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    for fmt in _DATE_FORMATS:
        try:
            return datetime.strptime(text, fmt).replace(tzinfo=KST)
        except ValueError:
            continue
    return None


def parse_amount(value: object) -> int | None:
    """금액 문자열("123,000,000", "123000000.0" 등)을 원 단위 정수로 바꾼다."""
    if value is None:
        return None
    text = re.sub(r"[^\d.]", "", str(value))
    if not text:
        return None
    try:
        amount = int(float(text))
    except ValueError:
        return None
    return amount if amount > 0 else None


def _clean(value: object) -> str:
    return str(value).strip() if value is not None else ""


@dataclass
class Notice:
    kind: str
    bid_no: str
    bid_ord: str
    title: str
    org: str = ""  # 공고기관
    demand_org: str = ""  # 수요기관
    posted_at: datetime | None = None
    close_at: datetime | None = None
    open_at: datetime | None = None
    price: int | None = None  # 추정가격(원)
    budget: int | None = None  # 배정예산(원)
    url: str = ""
    method: str = ""  # 입찰방식
    contract_method: str = ""  # 계약체결방법
    region_limit: str = ""  # 참가제한지역
    raw: dict = field(default_factory=dict, repr=False)

    @property
    def key(self) -> str:
        return f"{self.bid_no}-{self.bid_ord or '000'}"

    @property
    def kind_name(self) -> str:
        return KIND_NAMES.get(self.kind, self.kind)

    @property
    def amount(self) -> int | None:
        """비교·표시에 쓸 대표 금액. 추정가격이 없으면 배정예산을 쓴다."""
        return self.price or self.budget

    def days_left(self, now: datetime) -> int | None:
        if not self.close_at:
            return None
        return (self.close_at.date() - now.astimezone(KST).date()).days

    @classmethod
    def from_api(cls, item: dict, kind: str) -> "Notice":
        return cls(
            kind=kind,
            bid_no=_clean(item.get("bidNtceNo")),
            bid_ord=_clean(item.get("bidNtceOrd")),
            title=_clean(item.get("bidNtceNm")),
            org=_clean(item.get("ntceInsttNm")),
            demand_org=_clean(item.get("dminsttNm")),
            posted_at=parse_datetime(item.get("bidNtceDt") or item.get("rgstDt")),
            close_at=parse_datetime(item.get("bidClseDt")),
            open_at=parse_datetime(item.get("opengDt")),
            price=parse_amount(item.get("presmptPrce")),
            budget=parse_amount(item.get("asignBdgtAmt")),
            url=_clean(item.get("bidNtceDtlUrl") or item.get("bidNtceUrl")),
            method=_clean(item.get("bidMethdNm")),
            contract_method=_clean(item.get("cntrctCnclsMthdNm")),
            region_limit=_clean(item.get("prtcptLmtRgnNm")),
            raw=item,
        )


def format_won(amount: int | None) -> str:
    """금액을 '3억 2,000만원'처럼 읽기 쉬운 한국식 표기로 바꾼다."""
    if not amount:
        return "금액 미공개"
    eok, rest = divmod(amount, 100_000_000)
    man = rest // 10_000
    parts = []
    if eok:
        parts.append(f"{eok:,}억")
    if man:
        parts.append(f"{man:,}만")
    if not parts:
        return f"{amount:,}원"
    return " ".join(parts) + "원"
