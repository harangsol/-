# 하랑솔루션 홍보영상 (세로 9:16)

릴스·쇼츠·틱톡용 상담신청 유도 영상 세 편입니다. 모두 1080×1920, 60fps입니다.

| 영상 | 게시용 (음악 포함, -14 LUFS) | 음성 얹기용 (배경음악 낮춤) | 내레이션 대본 |
|---|---|---|---|
| 본편 39초 | [`out/harangsol-promo-9x16.mp4`](out/harangsol-promo-9x16.mp4) | — | — |
| 인스타 숏폼 20초 | [`out/harangsol-short-9x16.mp4`](out/harangsol-short-9x16.mp4) | [`out/harangsol-short-9x16-voice-ready.mp4`](out/harangsol-short-9x16-voice-ready.mp4) | [`scripts/voiceover.md`](scripts/voiceover.md) 3장 |
| 정책자금 40초 | [`out/harangsol-fund-9x16.mp4`](out/harangsol-fund-9x16.mp4) | [`out/harangsol-fund-9x16-voice-ready.mp4`](out/harangsol-fund-9x16-voice-ready.mp4) | [`scripts/voiceover.md`](scripts/voiceover.md) 4장 |

화면은 HTML과 GSAP로 만든 모션그래픽이고, 음악과 효과음은 파이썬이 수식으로 직접 합성합니다. 외부 영상·사진·음원을 쓰지 않아 저작권 문제가 없습니다.

**일레븐랩스 음성 넣기**: 대본(`scripts/voiceover.md`)의 줄마다 음성을 만들어 `vo/short/S1.mp3`…, `vo/fund/F1.mp3`… 로 저장한 뒤 `python3 tools/mix_vo.py short` (또는 `fund`)를 실행하면 `out/…-with-voice.mp4`가 나옵니다. 음성이 나올 때 배경음악이 자동으로 줄어듭니다.

## 인스타그램 광고

광고 계획은 [`ads/instagram-campaign-plan.md`](ads/instagram-campaign-plan.md), 날마다 적는 성과표는 [`ads/tracker.csv`](ads/tracker.csv)(구글 시트로 열기)입니다.

광고에는 **광고판 영상**을 씁니다. 메타 광고 정책(보는 사람의 재정 상태를 단정·암시하지 않기)에 맞춰 정책자금 영상의 첫 문장과 끝 화면을 바꾸고, 끝 화면 안내를 "아래 신청하기 버튼"으로 바꾼 판입니다.

| 광고판 | 게시용 | 음성 얹기용 |
|---|---|---|
| 정책자금 40초 | [`out/ad-fund-9x16.mp4`](out/ad-fund-9x16.mp4) | [`out/ad-fund-9x16-voice-ready.mp4`](out/ad-fund-9x16-voice-ready.mp4) |
| 숏폼 20초 | [`out/ad-short-9x16.mp4`](out/ad-short-9x16.mp4) | [`out/ad-short-9x16-voice-ready.mp4`](out/ad-short-9x16-voice-ready.mp4) |
| **섞은 영상 38초** (사람 장면 + 모션그래픽 + 실제 로고) | [`out/ad-mix-9x16.mp4`](out/ad-mix-9x16.mp4) | [`out/ad-mix-9x16-voice-ready.mp4`](out/ad-mix-9x16-voice-ready.mp4) |

다시 만들기: `node render.mjs --page fund.html --variant ad --fps 60 --mux build/score-fund.wav=out/ad-fund-9x16.mp4 --mux build/score-fund-vo.wav=out/ad-fund-9x16-voice-ready.mp4`

## 섞은 영상 38초 흐름 (`mix.html`)

힉스필드로 만든 사람 장면(가게 사장님·카페·상담)과 정책자금 영상의 모션그래픽을 합친 광고용 영상입니다. 끝 화면에 실제 로고(`assets/logo-harangsol.png`)를 씁니다. 광고 버튼은 **더 알아보기**로 설정해야 끝 화면 안내와 맞습니다.

| 시간 | 장면 | 화면 |
|---|---|---|
| 0–4초 | 가게 사장님 (실사) | 사장님, 정책자금은 우리 가게와 **상관없다고** 생각하셨나요? |
| 4–9.5초 | 카페 사장님 (실사) → 그래픽 | 창업한 지 얼마 안 됐어도, 운영 중이어도 → 상황에 따라 **검토할 수 있는 자금**이 있습니다 |
| 9.5–13.5초 | 그래픽 | 기관·자금 이름 10개가 어지럽게: 종류도 많고 기관마다 조건도 다릅니다 |
| 13.5–18초 | 그래픽 (음악 드롭) | 하랑솔루션은 **순서**부터 정리합니다. 칩이 줄 맞춰 정렬 |
| 18–24초 | 상담 장면 (실사) + 그래픽 | 사장님 가게를 **진단**합니다: 업종·매출·업력·신용·부채 → 어떤 자금을, 어떤 순서로 |
| 24–30초 | 그래픽 | 정책자금, 무조건 되나요? **아닙니다.** 되는 것과 어려운 것, 먼저 구분해 드립니다 |
| 30–38초 | 흰 끝 화면 | 실제 로고 · 우리 가게도 대상이 될까요? · 무료로 진단받아 보세요 · 아래 '더 알아보기' |

실사 장면은 `assets/footage/*.mp4`(원본 영상의 위쪽만 잘라 낸 것)에 있습니다. 다시 만들 때:

```bash
python3 tools/prep_footage.py      # 실사 장면을 프레임 그림으로 풀기 (build/footage/)
python3 score_mix.py
node render.mjs --page mix.html --fps 60 \
  --mux build/score-mix.wav=out/ad-mix-9x16.mp4 \
  --mux build/score-mix-vo.wav=out/ad-mix-9x16-voice-ready.mp4
```

## 숏폼 20초 흐름 (`short.html`)

| 시간 | 장면 |
|---|---|
| 0–4초 | 매출은 늘었는데 왜 남는 돈은 없을까요? (본편과 같은 후킹) |
| 4–6초 | 상품이 아니라 **순서입니다** |
| 6–10초 | 매출보다 중요한 건, **돈의 흐름**입니다 + 로고 (8초 음악 드롭) |
| 10–14초 | 네 단계를 한 화면에: 조달·방어·보존·증식이 금빛 선으로 이어짐 |
| 14–20초 | 지금 상황만 알려주세요 → 무료 진단 상담 신청 버튼 |

## 정책자금 40초 흐름 (`fund.html`)

근거는 홈페이지 기획안 4장 ①정책자금·②대출 카드, 9장 FAQ 2번("정책자금은 무조건 받을 수 있나요? → 아닙니다")입니다.

| 시간 | 장면 | 의도 |
|---|---|---|
| 0–4초 | 대출 심사 결과에 **"부결"** 도장 → 아직, 끝이 아닙니다 | 은행 거절을 겪은 대표님을 바로 붙잡는다 |
| 4–10초 | 정책자금, 어디서부터 보세요? 기관·자금 이름 10개가 어지럽게 쏟아짐 → 한 번 거절에 멈추게 됩니다 | 혼자 하면 막막하다는 걸 보여 준다 |
| 10–14초 | 하랑솔루션은 **순서**부터 정리합니다. 흩어진 칩이 '기관 자금 / 지역·업종·지원사업'으로 정렬 | 혼란 → 정리, 음악 드롭 |
| 14–20초 | 업종·매출·업력·신용·부채를 진단 → 어떤 자금을, 어떤 순서로 (+ 대출을 볼 때는 월 상환액·만기·거치기간·향후 정책자금 영향까지) | 방법이 있다는 신뢰 |
| 20–26초 | 상담 예시 (화면에 "예시" 표시): 경기·제조업·연 매출 12억 → 추가 대출보다 정책자금 검토가 먼저 → ①신용 정리 ②기술보증기금 검토 ③시설자금 분리 신청 → 함께 본 것: 법인전환 시점·대표자 퇴직재원 | 구체적인 실행 순서, 정책자금 외 영역으로 연결 |
| 26–32초 | 정책자금, 무조건 되나요? **아닙니다.** 되는 것과 어려운 것, 먼저 구분해 드립니다 | 과장 광고와의 차별화, 규제 방어 |
| 32–40초 | 운영자금·시설자금 필요하시다면 → **정책자금 진단 상담 신청** 버튼 | 행동 유도 |

정책자금 영상 하단 고지: "정책자금 지원 여부와 한도는 각 기관의 심사 기준에 따라 달라집니다. 하랑솔루션은 자금을 직접 지원하거나 대출하지 않습니다." (`fund.html`의 `COPY.footnote`)

> 정책자금 컨설팅 광고는 공공기관들이 "수수료를 받고 승인을 약속하는 제3자 개입"을 경계하는 분야입니다. 영상과 대본에는 승인 약속·대행 표현을 넣지 않았습니다. 게시 전에 이 기준으로 한 번 더 확인하세요.

## 본편 39초 흐름 (`index.html`)

시청자가 "내 얘기네"라고 느끼게 한 뒤 → 하랑솔루션이 다르게 보는 방식 → 믿을 근거 → 신청 후 진행 절차 → 신청 버튼 순서입니다. 문구의 근거는 모두 홈페이지 기획안(`claude/harang-solution-homepage-plan-8qou94` 브랜치의 `docs/harangsol-homepage-plan.md`)에 정리된 회사 메시지입니다.

| 시간 | 장면 | 화면 문구 | 의도 |
|---|---|---|---|
| 0–4초 | 후킹 | 매출은 늘었는데 / 왜 **남는 돈**은 없을까요? (막대그래프가 갈라지며 동전이 새어 나감: 세금·이자·리스크) | 첫 2초 안에 대표님의 고민을 찌른다 |
| 4–10초 | 고민 체크리스트 | 혹시 이런 고민, 하고 계신가요? 6개 항목 체크 → 필요한 건 상품이 아니라 **순서입니다** | 하나라도 해당되면 끝까지 본다 |
| 10–13초 | 포지셔닝 | 하랑솔루션은 ~~정책자금만~~ ~~보험만~~ ~~대출만~~ ~~법인전환만~~ 하는 곳이 아닙니다 | 동종 광고와 바로 구별된다 |
| 13–16초 | 브랜드 | 매출보다 중요한 건, **돈의 흐름**입니다 + 로고 | 음악 드롭, 핵심 메시지 각인 |
| 16–24초 | 4단계 | 01 조달 → 02 방어 → 03 보존 → 04 증식. 금빛 선 하나가 네 단계를 이어 내려감 | 6개 사업영역을 "순서를 아는 회사"로 보여 준다 |
| 24–26초 | 전체 보기 | 화면이 줄어들며 네 단계 전체가 한 줄기로 보임 / 대부분의 상담은 '조달'에서 끝납니다. 하랑솔루션은 네 단계를 같이 봅니다 | 차별점 한 문장 정리 |
| 26–30초 | 상담 원칙 | 무조건 된다고 하지 않습니다 / 되는 것과 어려운 것, 구분해 드립니다 / 필요 없는 건 하지 마시라고 말씀드립니다 | 신뢰. 광고 규제 방어선 역할도 함 |
| 30–34초 | 진행 절차 | 문의·신청 → 전화 상담 → 1차 미팅 → 진단·실행안 → 실행·지속관리 + 분야별 전문가 네트워크 | 신청 후 무슨 일이 생기는지 보여 줘 망설임을 없앤다 |
| 34–39초 | 신청 유도 | 지금 상황만 알려주세요 / **무료 진단 상담 신청** 버튼을 손가락이 누름 / 프로필 링크 · 카카오톡 · 전화 | 행동 유도 |

## 올리기 전에 확인할 것

- [ ] **"무료 진단 상담"**: 홈페이지 기획안의 버튼 문구를 그대로 썼습니다(본편·숏폼). 실제로 상담 비용이 없을 때만 쓰세요. 아니라면 `index.html`·`short.html`의 `COPY.ctaButton`을 "진단 상담 신청" 등으로 바꿉니다. 정책자금 영상 버튼은 "정책자금 진단 상담 신청"입니다.
- [ ] **신청 경로**: 마지막 화면은 "프로필 링크 · 카카오톡 · 전화"입니다. 전화번호나 카카오톡 채널명을 넣으려면 `COPY.ctaWays`를 고칩니다.
- [ ] **로고**: 영상 속 로고(남색 사각형 안의 금빛 곡선)는 임시로 만든 것입니다. 정식 로고가 있으면 교체해야 합니다(아래 '문구·로고 바꾸기').
- [ ] **하단 고지문**: "정책자금·대출 가능 여부는 각 기관과 금융회사의 심사에 따라 달라집니다. 하랑솔루션은 직접 대출하지 않으며, 분야별 금융기관·전문가와 연계합니다." 기획안 10장의 광고 규제 검토에 맞춰 넣었습니다. 대출모집 등록번호 등 표기 의무가 있으면 `COPY.footnote`에 추가하세요.
- [ ] 파트너사 이름·로고는 사전 동의가 필요해 넣지 않았습니다. 분야(세무·법무·노무 등)만 표시합니다.
- [ ] "100% 승인", "최대 O억" 같은 확정 표현은 일부러 쓰지 않았습니다.

## 올릴 때 팁

- **릴스·쇼츠 하단 300px, 오른쪽 140px**은 앱 버튼과 설명이 가립니다. 핵심 문구는 그 바깥에 두었습니다.
- 표지(커버)는 13.5–15초 구간("돈의 흐름입니다" + 로고)이나 25초(네 단계 전체 화면)를 고르면 눈에 띕니다.
- 캡션 예시: `매출은 느는데 왜 남는 돈은 없을까요? 정책자금·대출·절세·법인전환·안전관리·대표자 자산까지, 순서부터 같이 봅니다. 프로필 링크에서 진단 상담 신청하세요.`
- 해시태그 예시: `#정책자금 #법인전환 #절세 #중대재해처벌법 #사업자대출 #개인사업자 #대표님 #가업승계 #하랑솔루션`

## 다시 만들기

Node.js 20 이상, Python 3.11 이상, ffmpeg, Playwright(Chromium)가 필요합니다.

```bash
cd promo-video
npm install                            # gsap, pretendard 글꼴
pip install numpy scipy pyloudnorm     # 음악 합성용

# 본편
python3 score.py && node render.mjs --fps 60

# 숏폼
python3 score_short.py
node render.mjs --page short.html --fps 60 \
  --mux build/score-short.wav=out/harangsol-short-9x16.mp4 \
  --mux build/score-short-vo.wav=out/harangsol-short-9x16-voice-ready.mp4

# 정책자금
python3 score_fund.py
node render.mjs --page fund.html --fps 60 \
  --mux build/score-fund.wav=out/harangsol-fund-9x16.mp4 \
  --mux build/score-fund-vo.wav=out/harangsol-fund-9x16-voice-ready.mp4
```

| 명령 | 용도 |
|---|---|
| `node render.mjs --page fund.html --stills 2,15,25` | 지정한 초의 정지화면만 `build/stills-fund/`에 저장 (빠른 확인용) |
| `node render.mjs --page fund.html --mux-only --mux …` | 이미 뽑은 프레임에 음악만 다시 합치기 |
| `python3 tools/vo_check.py cues-short.js cues-fund.js` | 내레이션 줄이 영상 자리에 들어가는지 확인 |
| `python3 tools/mix_vo.py short` | 일레븐랩스 음성(`vo/short/S1.mp3`…)을 얹은 완성본 만들기 |
| `node render.mjs --fps 30` | 30fps로 빠르게 렌더 (약 1분 반) |
| `python3 tools/contact_sheet.py` | 정지화면을 한 장에 모아 비교 |
| 브라우저로 `index.html` 열기 | 재생 버튼과 탐색 막대로 미리보기 (로컬 서버 필요: `npx serve` 등) |

## 문구·로고 바꾸기

- **글자**: 각 HTML(`index.html`, `short.html`, `fund.html`) 안의 `COPY` 묶음만 고치면 됩니다(회사명, 버튼, 고지문, 장면 문구).
- **타이밍**: `cues.js`·`cues-short.js`·`cues-fund.js`에서 장면별 시작 초를 바꾸면 화면과 음악이 함께 움직입니다. 음악은 120BPM(0.5초 단위)이라 0.5초 단위로 옮기는 것이 가장 자연스럽습니다.
- **로고**: `index.html`의 `logoHTML()` 함수 안 `<svg>`를 정식 로고 SVG로 바꿉니다.
- **색**: `:root`의 `--navy`, `--gold` 등. 기획안 8.2의 브랜드 색(딥 네이비 #10243E, 골드 #C9A227)을 썼습니다.

## 파일

| 파일 | 역할 |
|---|---|
| `index.html` · `cues.js` · `score.py` | 본편 화면 · 타이밍 · 음악 |
| `short.html` · `cues-short.js` · `score_short.py` | 숏폼 화면 · 타이밍(+내레이션 줄) · 음악 |
| `fund.html` · `cues-fund.js` · `score_fund.py` | 정책자금 화면 · 타이밍(+내레이션 줄) · 음악 |
| `mix.html` · `cues-mix.js` · `score_mix.py` | 섞은 영상 화면 · 타이밍(+내레이션 줄) · 음악 |
| `assets/` | 실제 로고, 실사 장면 클립 |
| `tools/prep_footage.py` | 실사 장면을 프레임 그림으로 풀기 |
| `lib/base.css` · `lib/engine.js` | 숏폼·정책자금 공통 스타일과 애니메이션 도구 |
| `synth.py` | 숏폼·정책자금 공통 악기·믹서 (게시용 -14 LUFS, 음성용 -21 LUFS 두 벌 출력) |
| `render.mjs` | 프레임 캡처 → ffmpeg 인코딩 |
| `scripts/voiceover.md` | 일레븐랩스 내레이션 대본과 설정 |
| `tools/mix_vo.py` · `tools/vo_check.py` | 음성 얹기 · 대본 길이 확인 |
| `tools/contact_sheet.py` | 검토용 정지화면 모음 |
| `out/` | 완성 영상 |
