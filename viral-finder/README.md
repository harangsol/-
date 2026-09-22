# viral-finder

정책자금 · 절세 · 저축 주제의 **인스타그램 릴스 / 스레드 터진 글**을 찾아
점수 매기고 후킹 문장까지 뽑아 주는 CLI.

---

## 먼저 알아야 할 것: 자동 수집의 현실

"프로그램으로 직접 찾을 수 있냐"에 대한 정확한 답은 **"수집 경로에 따라 다르다"** 이다.
파이프라인(필터 → 점수 → 리포트)은 완전 자동이지만, **데이터를 가져오는 입구가 문제**다.

| 경로 | 키워드 검색 | 조회수 | 팔로워 수 | 스레드 | 비용 | 상태 |
| --- | --- | --- | --- | --- | --- | --- |
| **Meta Instagram Graph API** (공식) | 해시태그만 | ❌ 타인 게시물 불가 | ❌ | ❌ 미지원 | 무료 | 앱 심사 + 프로페셔널 계정 필요, 해시태그 7일당 30개 쿼터 |
| **Threads API** (공식) | ❌ | 내 글만 | ❌ | 내 글만 | 무료 | 타인 글 검색 기능 자체가 없음 |
| **Apify 등 스크래핑 액터** | ⭕ | ⭕ (대체로) | ⭕ (별도 호출) | ⭕ | 건당 과금 | 실질적으로 유일하게 쓸 만한 자동 경로. 플랫폼 ToS 와 충돌 소지 |
| **직접 브라우저 자동화** | ⭕ | ⭕ | ⭕ | ⭕ | 무료 | 로그인 필요 · 계정 차단 위험 높음 · **권장하지 않음** |
| **수동 CSV 반입** | - | ⭕ | ⭕ | ⭕ | 무료 | 손으로 모은 목록을 점수화. 가장 안전 |

정리하면:

- **공식 API 만으로 "조회수 터진 릴스"를 고르는 건 불가능하다.** 타인 게시물의 조회수와
  팔로워 수를 공식 API 가 내주지 않기 때문이다. 좋아요·댓글이라는 대리 지표까지가 한계다.
- 조회수까지 보려면 사실상 **Apify 같은 스크래핑 액터에 과금**하는 경로뿐이다.
  이 도구는 그 경로를 1급 소스로 지원하되, 토큰은 사용자가 직접 넣도록 했다.
- 그래서 이 도구는 **수집기를 갈아 끼울 수 있는 구조**로 만들었다. 어떤 경로로 긁어 왔든
  같은 필터·점수·리포트를 태운다. 수동 CSV 반입도 1급 소스다.

계정 차단을 감수하는 로그인 자동화는 포함하지 않았다. 필요하면 별도 소스 모듈로 붙일 수
있게 인터페이스는 열려 있다.

---

## 바로 돌려 보기 (키 없이)

```bash
cd viral-finder
python3 -m viralfinder collect --source sample   # 합성 데모 데이터 26건 적재
python3 -m viralfinder rank --top 10             # 터미널 랭킹
python3 -m viralfinder report --out reports/out.md
python3 -m viralfinder hooks --top 15            # 후킹 문장 유형 분포
```

`--source sample` 데이터는 **합성 데이터**다. 실제 게시물이 아니고 URL 도 열리지 않는다.
파이프라인이 실제로 도는지 확인하는 용도다. 결과 예시는 `reports/sample-report.md`.

## 실제 수집 붙이기

```bash
cp config/env.example .env && vi .env && source .env

# 인스타: config 의 seed_hashtags 전체로 수집
python3 -m viralfinder collect --source apify-instagram --limit 100 --enrich-followers

# 주제 한정
python3 -m viralfinder collect --source apify-instagram --topic 절세 --limit 200

# 검색어 직접 지정
python3 -m viralfinder collect --source apify-threads --query 정책자금 --query 소상공인 --limit 100

# 공식 API (조회수·팔로워 없음, 좋아요/댓글까지만)
python3 -m viralfinder collect --source graph-hashtag --topic 정책자금

# 손으로 모은 목록
python3 -m viralfinder collect --source file --file my_posts.csv
```

액터 ID 나 입력 스키마가 바뀌면 `--actor`, `--input-json` 으로 덮어쓴다.

```bash
python3 -m viralfinder collect --source apify-instagram \
  --actor "someone~another-instagram-actor" \
  --input-json '{"resultsType":"posts","searchType":"hashtag"}'
```

---

## 점수 방식

'터졌다'를 세 축으로 나눠 본다.

| 축 | 가중치 | 무엇을 보나 |
| --- | --- | --- |
| 속도 velocity | 30 | 올라온 지 얼마 안 됐는데 반응이 몰렸나 (반응량 ÷ 경과시간) |
| 도달 reach | 25 | 절대 조회수 자체가 큰가 |
| 팔로워 대비 이상치 | 20 | 팔로워 수에 비해 유별나게 퍼졌나 |
| 계정 자체 대비 이상치 | 15 | 그 계정 평소 성적(중앙값) 대비 몇 배인가 |
| 주제 적합도 | 10 | 정책자금/절세/저축 키워드에 실제로 맞나 |

**핵심은 3·4번이다.** 팔로워 50만 계정의 좋아요 3천은 평타지만, 팔로워 2천 계정의
좋아요 3천은 알고리즘이 밀어준 글이다. 벤치마킹할 가치가 있는 건 후자다.
4번은 같은 계정 글이 3건 이상 모였을 때만 활성화된다.

반응량은 `좋아요 + 댓글×3 + 공유×4 + 저장×5`. 정책자금·절세처럼 전환을 노리는 주제에선
저장과 댓글이 좋아요보다 훨씬 무겁다.

점수는 **배치 내 상대 평가(백분위)** 다. 정책자금 릴스의 '잘 된 수치'와 저축 스레드의
그것은 자릿수가 달라서, 임의의 절대 상수를 박는 것보다 같이 모아 놓고 비교하는 편이 정직하다.
절대 감각이 필요하면 뱃지(`조회수 10만+`, `팔로워 대비 88배 도달` 등)를 보면 된다.

지표가 없는 축은 자동으로 빠지고 나머지 가중치가 재정규화된다. 스레드처럼 조회수가
안 잡히는 경우에도 랭킹이 무너지지 않는다.

## 주제 필터

해시태그로 긁으면 `#재테크` 하나 붙은 맛집 릴스까지 딸려온다. `config/keywords.json` 의
주제별 **핵심어/보조어** 사전으로 본문을 대조해 걸러낸다.

- 핵심어 1개 = 0.6, 2개 이상 = 0.85, 보조어는 0.1씩 가산
- 두 주제가 겹치면(정책자금 + 절세) +0.1
- `negative` 목록(리딩방, 작업대출 등)에 걸리면 0점 → 저장 안 함

키워드는 JSON 만 고치면 된다. 코드 수정 필요 없다.

## 후킹 문장 분석

상위 글의 첫 줄을 뽑아 `숫자제시 / 손실회피 / 비밀공개 / 지시형 / 대상지목 / 기한압박 /
질문형 / 경험담` 8가지 유형으로 태깅한다. 리포트 하단에 유형별 빈도가 나온다.
어떤 각도가 이 주제에서 먹히는지 보는 용도다.

## 재수집과 증가 추적

같은 글을 다시 수집하면 지표가 갱신되고 `metric_history` 에 이력이 쌓인다.
하루 간격으로 두 번 이상 돌리면 `Store.growth(key)` 로 시간당 증가분을 계산할 수 있어,
"이미 터진 글"이 아니라 **"지금 터지는 중인 글"** 을 잡아낼 수 있다.

```bash
# cron 예: 매일 오전 9시
0 9 * * * cd /path/to/viral-finder && source .env && \
  python3 -m viralfinder collect --source apify-instagram --limit 100 && \
  python3 -m viralfinder report --days 30 --out reports/$(date +\%F).md
```

---

## 구조

```
viral-finder/
├── viralfinder/
│   ├── models.py        Post 데이터 모델, 타임스탬프 정규화
│   ├── config.py        키워드 설정 로딩
│   ├── relevance.py     주제 적합도 판정 + 후킹 유형 태깅
│   ├── scoring.py       바이럴 점수 (백분위 기반)
│   ├── store.py         SQLite 저장 + 지표 이력
│   ├── report.py        터미널 / 마크다운 / CSV 출력
│   ├── cli.py           명령줄 인터페이스
│   └── sources/         수집 소스 플러그인
│       ├── base.py      레지스트리
│       ├── sample.py    합성 데모 데이터
│       ├── csv_import.py CSV/JSON 반입 (한글 컬럼명 인식)
│       ├── apify.py     Apify 액터 래퍼
│       └── graph_api.py Meta 공식 API
├── config/keywords.json 주제 사전 (여기만 고치면 됨)
├── data/                sample_posts.json, posts.db
└── tests/               python3 -m unittest discover -s tests
```

새 수집 경로를 붙이려면 `sources/` 에 모듈 하나 만들고 `@register("이름")` 붙인 함수가
`list[Post]` 를 돌려주게 하면 된다. 나머지는 그대로 재사용된다.

## 주의

- Apify 등 스크래핑 경로는 각 플랫폼 이용약관과 충돌할 소지가 있다. 수집 대상·빈도·용도를
  확인하고 쓰는 건 사용자 책임이다.
- 수집한 타인 게시물은 **벤치마킹 분석용**이다. 본문을 그대로 복제해 올리는 건 저작권 문제다.
  이 도구가 후킹 '문장'이 아니라 후킹 '유형'을 집계하는 이유다.
- 정책자금·절세는 규제 영역이다. 분석 결과를 그대로 콘텐츠화할 때 금융/세무 광고 규정을
  별도로 확인해야 한다.
