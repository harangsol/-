"""화면 예시·테스트용 가상 공고.

실제 공고가 아니다. 기관명은 가상의 지명이고 공고번호는 SAMPLE로 시작한다.
날짜는 실행 시각 기준으로 만들어서 언제 돌려도 '마감 전' 공고가 나온다.
"""

from __future__ import annotations

from datetime import datetime, timedelta

from .models import KST, Notice

# (구분, 공고명, 공고기관, 수요기관, 추정가격, 마감까지 일수, 입찰방식, 계약방법, 참가제한지역)
_ROWS = [
    ("servc", "2027년 가람시 누리집(홈페이지) 통합 유지관리 용역", "가람시", "가람시", 168_000_000, 6,
     "전자입찰", "제한경쟁(협상에 의한 계약)", ""),
    ("servc", "한빛시 교육청 웹사이트 웹 접근성 개선 및 재구축", "조달청 서울지방조달청", "한빛시 교육청", 92_000_000, 2,
     "전자입찰", "제한경쟁(협상에 의한 계약)", ""),
    ("servc", "누리군 대민 문자·알림톡 통합메시지(UMS) 서비스 운영", "누리군", "누리군", 34_500_000, 4,
     "전자입찰", "일반경쟁(적격심사)", "경기도"),
    ("servc", "공공데이터 개방 포털 고도화 사업", "한국공공데이터원(가상)", "한국공공데이터원(가상)", 410_000_000, 12,
     "전자입찰", "제한경쟁(협상에 의한 계약)", ""),
    ("thng", "온라인 설문조사 솔루션 라이선스 구매", "새솔대학교", "새솔대학교", 18_700_000, 3,
     "전자입찰", "일반경쟁(최저가)", ""),
    ("servc", "기관 홍보 동영상 스트리밍 플랫폼 구축", "한빛문화재단", "한빛문화재단", 75_000_000, 9,
     "전자입찰", "제한경쟁(협상에 의한 계약)", ""),
    ("servc", "청사 시설 청소 및 경비 용역", "가람시", "가람시 시설관리공단", 520_000_000, 8,
     "전자입찰", "일반경쟁(적격심사)", "가람시"),
    ("servc", "모바일 앱(민원 안내) 유지보수", "누리군", "누리군 보건소", 21_000_000, 1,
     "전자입찰", "일반경쟁(적격심사)", ""),
    ("cnstwk", "가람시 체육관 지붕 보수공사", "가람시", "가람시", 310_000_000, 7,
     "전자입찰", "일반경쟁(적격심사)", "가람시"),
    ("servc", "전자문서 변환·뷰어 시스템 고도화", "한국공공데이터원(가상)", "한국공공데이터원(가상)", 128_000_000, 10,
     "전자입찰", "제한경쟁(협상에 의한 계약)", ""),
    ("servc", "구정 소식지 디자인 및 인쇄", "새솔구", "새솔구", 45_000_000, 5,
     "전자입찰", "일반경쟁(최저가)", ""),
    ("thng", "대용량 메일 발송 솔루션 유지관리 및 라이선스 갱신", "한빛시", "한빛시 정보통신과", 0, 5,
     "전자입찰", "제한경쟁(적격심사)", ""),
]


def sample_briefing():
    """AI 키 없이 미리보기를 만들 때 쓰는 예시 브리핑(가상 공고 기준으로 손으로 쓴 예시)."""
    from .ai import Briefing

    return Briefing(
        text="새 맞춤 공고 9건 중 마감 3일 이내가 3건입니다. "
        "한빛시 교육청 웹 접근성 재구축은 정정공고이고 마감이 이틀 남아 오늘 검토가 필요합니다. "
        "4억 원대 포털 고도화는 선호 규모를 넘으니 공동수급 허용 여부를 공고문에서 확인해 보세요.",
        picks={
            "SAMPLE0002-001": "웹 접근성 재구축 경험과 맞고 9,200만원 규모, 마감 D-2라 우선 검토",
            "SAMPLE0001-000": "누리집 통합 유지관리 1억 6,800만원으로 선호 규모에 딱 맞음",
            "SAMPLE0003-000": "UMS 자체 솔루션 보유, 경기도 제한이라 경쟁이 좁을 수 있음",
        },
    )


def sample_notices(now: datetime | None = None) -> list[Notice]:
    now = (now or datetime.now(KST)).astimezone(KST)
    posted = now.replace(hour=9, minute=30, second=0, microsecond=0) - timedelta(days=1)
    notices = []
    for i, (kind, title, org, demand, price, days, method, contract, region) in enumerate(_ROWS, 1):
        close = (now + timedelta(days=days)).replace(hour=10 if i % 2 else 14, minute=0, second=0, microsecond=0)
        item = {
            "bidNtceNo": f"SAMPLE{i:04d}",
            "bidNtceOrd": "001" if i == 2 else "000",
            "bidNtceNm": title,
            "ntceInsttNm": org,
            "dminsttNm": demand,
            "bidNtceDt": (posted + timedelta(minutes=17 * i)).strftime("%Y-%m-%d %H:%M:%S"),
            "bidClseDt": close.strftime("%Y-%m-%d %H:%M:%S"),
            "opengDt": (close + timedelta(hours=1)).strftime("%Y-%m-%d %H:%M:%S"),
            "presmptPrce": str(price) if price else "",
            "bidMethdNm": method,
            "cntrctCnclsMthdNm": contract,
            "prtcptLmtRgnNm": region,
            "bidNtceDtlUrl": "",
        }
        notices.append(Notice.from_api(item, kind))
    return notices
