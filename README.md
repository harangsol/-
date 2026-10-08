# 황진 — 대출·보험·연금·퇴직연금·투자 금융가이드

> 잘 벌고, 잘 쓰고, 오래 잘 살기.

가망고객과 기존고객이 **황진이 어떤 사람이고, 어떤 금융 일을 하며, 왜 믿을 수 있는지** 이해하고,
스스로 1분 점검을 해본 뒤 부담 없이 물어보거나 **주변에 소개하고 싶어지는** 개인 브랜드 페이지입니다.
하랑솔루션(B2B)과 분리된 개인 브랜드(B2C) 사이트이며, 화면에는 별도 브랜드명 없이 '황진'만 씁니다.

### 홈 화면 흐름 (10개 섹션 + 푸터, 모바일 약 11화면)

| # | 섹션 | 배경 | 방문자가 하게 되는 생각 |
| --- | --- | --- | --- |
| 01 | HERO — 금융 현장 13년 · 잘 벌고, 잘 쓰고, 오래 잘 살기 | 아이보리 | 황진? 금융 일을 오래 했구나 |
| 02 | 황진은 이런 일을 합니다 + 업무 기반 + 사업을 하시는 경우 | 베이지 | 보험만 하는 게 아니네. 사업자 정책자금까지 |
| 03 | 상품보다 상황을 먼저 봅니다 | 네이비 | 상품부터 권하지 않는구나 |
| 04 | 왜 황진인가 (사진·13년·시행착오) | 아이보리 | 믿을 만하다 |
| 05 | 실제 상담은 이렇게 생각합니다 (CASE 01~03) | 베이지 | 전체 상황부터 보는구나 |
| 06 | 상담 과정 (STEP 01~04) | 아이보리 | 상품 이야기는 맨 마지막 |
| 07 | 1분 금융점검 | 베이지 | 나도 한번 정리해볼까? |
| 08 | 제가 드리지 않는 것 | 네이비 | 물어봐도 부담 없겠네 |
| 09 | 주변에 이런 분이 떠오른다면 (공유) | 아이보리 | 주변에 보내줘야겠다 |
| 10 | 최종 CTA | 네이비 | 순서부터 정해보자 |
| — | 푸터 (업무영역·업무 기반·면책) | 베이지 | |

네이비 섹션은 연달아 붙지 않게 배치했습니다. 회사·등록 정보(업무 기반)는 **02 섹션과 푸터, 두 곳에만** 나옵니다.

- Next.js 16 (App Router, Cache Components) · React 19 · TypeScript · Tailwind CSS 4
- 외부 UI 라이브러리 없음. 런타임 의존성은 `next`, `react`, `react-dom` 세 개뿐입니다.
- 상담 신청 저장: Supabase (REST API 직접 호출, SDK 없음)

---

## 사이트 구조

| 경로 | 내용 | 렌더링 |
| --- | --- | --- |
| `/` | 홈 (위 흐름 표) | 정적 |
| `/check` | 1분 점검 (한 화면 한 질문, `?q=1..9`) | 정적 + 클라이언트 |
| `/check/result` | 점검 결과 (검색 노출 안 함) | 정적 + 클라이언트 |
| `/contact` | 카카오톡 · 간단 상담신청 · 전화 | 정적 + 클라이언트 |
| `/privacy`, `/terms` | 개인정보처리방침, 이용안내 | 정적 |
| `/api/consultation` | 상담 신청 접수 (POST) | 서버 |
| `/og-image?preset=home\|check` | 공유 이미지 미리보기·다운로드 | 서버 |
| `/opengraph-image`, `/check/opengraph-image` | 페이지별 OG 이미지 (빌드 시 생성) | 정적 |
| `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest` | SEO | 정적 |

```
src/
├─ app/                     라우트 (위 표)
├─ components/
│  ├─ home/                 홈 섹션, HERO 비주얼·프로필 카드, 상담 사례 탭
│  ├─ diagnostic/           1분 점검, 결과 화면
│  ├─ contact/              상담 옵션, 상담 폼, 동의 요약
│  ├─ layout/               헤더, 푸터, 하단 고정 CTA, 분석 로더
│  └─ ui/                   버튼·섹션·모달 등 기본 요소
├─ config/
│  ├─ site.ts               이름·SEO 문구, 경력(profile), 공유 문구(share), 연락처, 사진 슬롯, 금융 고지
│  ├─ profileAffiliations.ts 업무 기반: 회사·관계·등록번호 (⚠️ 공개 전 운영자 검수)
│  ├─ cases.ts              상담 사례 CASE 01~03 (현재 SAMPLE — 실제 사례로 교체)
│  └─ privacy.ts            개인정보 항목·목적·보유기간 (법률 검토 대상)
├─ lib/
│  ├─ diagnostic/           질문(questions.ts), 점수(scoring.ts), 저장(storage.ts)
│  ├─ consultation/         입력 검증(validate.ts), Supabase 저장(store.ts)
│  ├─ analytics.ts          GA4·Meta 이벤트 (파라미터 화이트리스트)
│  └─ og-image.tsx          OG 이미지 렌더러
└─ assets/fonts/            OG 이미지용 Pretendard (한글 2,350자 서브셋)
supabase/migrations/        상담 테이블 SQL
tests/                      점수 계산·입력 검증 테스트
scripts/build-site-font.py  사이트 전용 폰트 서브셋 생성
```

---

## 1. 로컬 실행

Node.js 20.9 이상(권장 22)이 필요합니다.

```bash
npm install
cp .env.example .env.local   # 값 채우기 (비워둬도 실행은 됩니다)
npm run dev                  # http://localhost:3000
```

| 명령 | 용도 |
| --- | --- |
| `npm run build && npm start` | 프로덕션 빌드·실행 |
| `npm run lint` | ESLint |
| `npm test` | 점수 계산·입력 검증 테스트 (Node 내장 러너) |
| `npm run typecheck` | 타입 검사 |
| `npm run check:launch` | 공개 전 빠진 값 점검 (회사 관계·등록번호 자리표시, 사진, 사례, 환경변수). `-- --strict`면 자리표시가 남았을 때 실패 |

로컬에서 `SUPABASE_URL`이 비어 있으면 상담 신청은 **저장하지 않고 성공 처리**됩니다(개인정보는 로그에도 남기지 않음).
프로덕션에서 비어 있으면 신청 시 "카카오톡이나 전화로 연락 주세요" 안내가 뜹니다.

## 2. 환경변수

`.env.example`에 전체 목록과 설명이 있습니다.

| 이름 | 필수 | 설명 |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | ✅ | 대표 도메인. 예: `https://hwangjin.kr` |
| `NEXT_PUBLIC_KAKAO_CONTACT_URL` |  | 카카오톡 채널 채팅 URL. 비우면 버튼 숨김 |
| `NEXT_PUBLIC_PHONE` |  | 전화 문의 번호. 비우면 버튼 숨김 |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` |  | `G-`로 시작하는 GA4 측정 ID |
| `NEXT_PUBLIC_META_PIXEL_ID` |  | 숫자로 된 Meta Pixel ID |
| `NEXT_PUBLIC_INSTAGRAM_URL`, `NEXT_PUBLIC_THREADS_URL` |  | 푸터 링크·구조화 데이터(sameAs) |
| `NEXT_PUBLIC_PRIVACY_EMAIL` |  | 개인정보 문의 이메일 |
| `NEXT_PUBLIC_AFFILIATION` |  | 소속·등록번호 등 법정 표기 |
| `SUPABASE_URL` | ✅(운영) | Supabase 프로젝트 URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅(운영) | **서버 전용** secret key(`sb_secret_…`) 또는 legacy service_role 키 |

`NEXT_PUBLIC_` 값은 빌드할 때 코드에 들어갑니다. 바꾼 뒤에는 **재배포**해야 반영됩니다.

## 3. Vercel 배포

1. 이 저장소를 GitHub에 올린 뒤 [vercel.com/new](https://vercel.com/new)에서 Import합니다. Framework는 Next.js로 자동 인식됩니다.
2. **Settings → Environment Variables**에 위 값을 Production(필요하면 Preview도)으로 넣습니다.
3. Deploy. 이후 `main`(기본 브랜치)에 푸시할 때마다 자동 배포됩니다.

### Supabase 준비 (상담 저장소)

1. [supabase.com](https://supabase.com)에서 프로젝트를 만듭니다. 리전은 **Northeast Asia (Seoul)** 권장(국외 이전 고지 부담이 줄어듭니다).
2. **SQL Editor**에 `supabase/migrations/0001_consultations.sql`을 붙여 넣고 실행합니다.
3. **Project Settings → API**에서 Project URL과 secret key를 복사해 `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`에 넣습니다.
4. 들어온 신청은 **Table Editor → consultations**에서 봅니다. `status`(new/contacted/done/dropped)와 `memo` 컬럼은 운영 메모용입니다.
5. 보유기간 자동 파기를 원하면 마이그레이션 파일 맨 아래 `pg_cron` 주석을 따라 설정합니다.

> **왜 Supabase인가**
> - 상담 데이터는 표 형태로 쌓고 운영자가 바로 보고 메모해야 합니다. Supabase는 별도 관리자 화면을 만들지 않아도 대시보드에서 조회·수정·CSV 내보내기가 됩니다.
> - PostgreSQL이라 나중에 관리자 화면, 알림, CRM 연동으로 확장하기 쉽습니다.
> - 테이블에 RLS를 켜고 정책을 만들지 않았기 때문에 공개 키로는 읽기·쓰기가 전혀 안 됩니다. 쓰기는 서버(`/api/consultation`)만 secret key로 합니다.
> - 서울 리전이 있고, 무료 플랜으로 MVP 운영이 충분합니다.
> - SDK 없이 `fetch` 한 번으로 저장해 번들과 의존성이 늘지 않습니다.
>
> 폼 백엔드(Formspree 등)는 더 간단하지만 데이터가 해외 서비스 메일함에 흩어지고 상태 관리·확장이 어려워 제외했습니다.

## 4. 커스텀 도메인 연결

도메인은 코드에 하드코딩되어 있지 않습니다. `NEXT_PUBLIC_SITE_URL` 하나만 바꾸면 canonical, OG, sitemap, robots, 구조화 데이터가 따라 바뀝니다.

1. 도메인 구매 전 등록 가능 여부를 확인합니다(후보: `hwangjin.kr`, `luckyhwangjin.com`, `hjfinance.kr`).
2. Vercel **Project → Settings → Domains**에서 `hwangjin.kr`과 `www.hwangjin.kr`을 모두 추가합니다.
3. 대표로 쓸 쪽(예: apex `hwangjin.kr`)을 Primary로 두고, 다른 쪽은 **Redirect to hwangjin.kr (308)**로 설정합니다.
4. DNS 설정
   - **도메인 업체 DNS를 그대로 쓰는 경우**: Vercel이 안내하는 A 레코드(apex)와 CNAME(`www` → `cname.vercel-dns.com`)를 등록합니다.
   - **Cloudflare를 쓰는 경우**: 같은 레코드를 추가하되 처음에는 프록시를 **DNS only(회색 구름)**로 두세요. Vercel이 SSL 인증서를 발급한 뒤 필요하면 켜고, 이때 SSL/TLS 모드는 **Full (strict)**로 둡니다.
5. `NEXT_PUBLIC_SITE_URL=https://hwangjin.kr`로 바꾸고 재배포합니다.

HTTPS는 Vercel이 자동 발급·갱신합니다. 사이트는 HSTS 헤더를 보내고, `next.config.ts`에서도 www↔apex 중 대표가 아닌 쪽을 301로 보냅니다(Vercel 설정과 이중 안전장치).

## 5. GA4 설정

1. [analytics.google.com](https://analytics.google.com)에서 속성 → 웹 데이터 스트림을 만들고 측정 ID(`G-…`)를 `NEXT_PUBLIC_GA_MEASUREMENT_ID`에 넣습니다.
2. 라우트 이동마다 `page_view`를 코드에서 직접 보냅니다. 중복을 막기 위해 데이터 스트림 → **향상된 측정 → 페이지 조회수 → '브라우저 기록 이벤트 기반 페이지 변경' 체크를 해제**하세요.
3. 같은 화면에서 '스크롤'도 끄는 것을 권장합니다(코드가 `scroll_50`, `scroll_90`을 보냅니다).
4. **관리 → 맞춤 정의**에서 이벤트 매개변수 `question_id`, `answer_bucket`, `score`, `result_type`, `interest_area`, `priority_tags`, `location`을 맞춤 측정기준으로 등록하면 보고서에서 볼 수 있습니다.
5. **관리 → 이벤트 → 주요 이벤트**에 `consultation_submit`(필요하면 `kakao_contact_click`, `phone_contact_click`)를 지정합니다.
6. **탐색 → 유입경로 탐색 분석**으로 아래 퍼널을 만듭니다.

### 퍼널과 KPI

```
방문(page_view /) → hero_cta_click → diagnostic_start → diagnostic_complete
  → result_cta_click → consultation_form_view (또는 kakao/phone_contact_click) → consultation_submit
```

| KPI | 계산 | 볼 때 |
| --- | --- | --- |
| 방문 → 진단 시작률 | `diagnostic_start` ÷ 홈 `page_view` 사용자 | HERO·카피가 설득되는가 |
| 진단 시작 → 완료율 | `diagnostic_complete` ÷ `diagnostic_start` | 질문이 길거나 어렵지 않은가 (`diagnostic_question_view`의 `question_id`별 이탈 확인) |
| 결과 → 상담 CTA 클릭률 | `result_cta_click` ÷ `result_view` | `result_type`별로 비교 |
| 상담 CTA → 제출률 | (`consultation_submit` + 카카오·전화 클릭) ÷ `result_cta_click` | 폼·채널 마찰 |
| 전체 방문 → 상담 전환율 | (`consultation_submit` + 카카오·전화 클릭) ÷ 방문 사용자 | 최종 성과 |

Instagram·Threads 프로필 링크에 `?utm_source=instagram&utm_medium=social&utm_campaign=bio`처럼 UTM을 붙이면 채널별로 나뉘어 보이고, 상담 신청 행에도 같은 값이 저장됩니다.

### 섹션 노출 · 문의 선택 이벤트

| 이벤트 | 언제 | 파라미터 |
| --- | --- | --- |
| `loan_section_view` | 홈 '대출 · 부채관리' 항목이 화면에 보였을 때 (1회) | `location` |
| `profile_affiliation_view` | 홈 '업무 기반'이 화면에 보였을 때 (1회) | `location` |
| `referral_section_view` | 홈 '주변에 이런 분이 떠오른다면'이 보였을 때 (1회) | `location` |
| `contact_option_click` | 카카오톡·연락처 남기기·전화 중 하나를 눌렀을 때 | `location`, `method`(kakao·form·phone), `result_type` |

### 소개(추천) 지표

| 이벤트 | 언제 | 파라미터 |
| --- | --- | --- |
| `referral_share_click` | '지인에게 이 페이지 보내기' 클릭 | `location`(home_referral·result), `method`(share_sheet·copy) |
| `referral_url_copy` | 공유 시트가 없는 브라우저에서 링크 복사 완료 | `location` |

공유된 링크에는 `utm_source=referral&utm_medium=share&utm_campaign=friend`가 붙습니다. GA에서 **소개로 들어온 방문 → 점검 → 상담** 전환을 따로 볼 수 있고, 상담 신청 행의 `utm_source`가 `referral`이면 지인 소개로 온 분입니다.

| KPI | 계산 |
| --- | --- |
| 공유 클릭률 | `referral_share_click` ÷ 홈 방문 사용자 |
| 소개 유입 상담 전환율 | `utm_source=referral` 세션의 `consultation_submit` ÷ 같은 세션 수 |

## 6. Meta Pixel 설정

1. Meta 이벤트 관리자에서 픽셀을 만들고 ID를 `NEXT_PUBLIC_META_PIXEL_ID`에 넣습니다.
2. 코드는 자동 이벤트 수집(`autoConfig`)을 꺼둡니다. 이벤트 관리자 **설정 → 자동 고급 매칭도 꺼주세요**. 켜두면 폼 입력값(이름·전화번호)을 해시해서 가져갈 수 있습니다.
3. 전송 이벤트

| 사이트 이벤트 | Meta |
| --- | --- |
| `page_view` | `PageView` (표준) |
| `consultation_submit` | `Lead` (표준) + `trackCustom consultation_submit` |
| `kakao_contact_click`, `phone_contact_click` | `Contact` (표준) + `trackCustom` 같은 이름 |
| 그 외 모든 이벤트 | `trackCustom` 같은 이름 |

광고 최적화 목표는 `Lead`, 리타겟팅 대상은 `result_view` 맞춤 이벤트를 추천합니다.

### 분석 도구로 보내지 않는 것

`src/lib/analytics.ts`의 화이트리스트(`ALLOWED_PARAMS`)에 있는 키만, 100자 이내로 전송됩니다. 이름·연락처·고민 내용·금액은 화이트리스트에 없어 **실수로 넘겨도 버려집니다**. `diagnostic_answer`는 `{ question_id: "q3", answer_bucket: "partial", score: 1 }` 형태만 보냅니다. URL에도 개인정보를 담지 않습니다.

## 7. 상담 채널 URL 설정

- 카카오톡: [카카오톡 채널 관리자센터](https://center-pf.kakao.com) → 채널 → **채널 URL** 뒤에 `/chat`을 붙인 주소(예: `https://pf.kakao.com/_AbCdE/chat`)를 `NEXT_PUBLIC_KAKAO_CONTACT_URL`에 넣습니다.
- 전화: `NEXT_PUBLIC_PHONE=010-1234-5678`. 화면에 그대로 표시되고 `tel:` 링크가 됩니다.
- 둘 중 하나를 비우면 그 버튼은 결과 화면·문의 화면에서 자동으로 사라집니다. 간단 상담신청은 항상 표시됩니다.
- 신청 후 안내 문구는 `src/config/site.ts`의 `contact.responseNote`에서 바꿉니다.

## 8. 개인정보처리방침 수정

- **`src/config/privacy.ts`** 한 곳에서 수집 항목, 목적, 보유기간(`retentionDays`), 파기, 제3자 제공, 처리 위탁, 국외 이전, 문의처를 관리합니다. `/privacy` 페이지와 상담 폼의 동의 모달이 모두 이 파일을 읽습니다.
- 문구를 바꾸면 `version`과 `effectiveDate`를 갱신하세요. 신청 행마다 `privacy_policy_version`이 함께 저장되어 어떤 버전에 동의했는지 남습니다.
- 보유기간을 바꾸면 Supabase 자동 파기 주기(`purge_expired_consultations(일수)`)도 같은 값으로 맞춥니다.
- ⚠️ 현재 문구는 **초안**입니다. 운영 전 법률/컴플라이언스 검토 후 확정해야 합니다. 특히 Supabase·Vercel 리전에 따른 국외 이전 고지, 소속사의 광고 심의 기준, `NEXT_PUBLIC_AFFILIATION`(소속·등록번호)을 확인하세요.

## 9. 카카오톡 URL 설정

7번과 같습니다. `NEXT_PUBLIC_KAKAO_CONTACT_URL`을 Vercel 환경변수에 넣고 재배포하면 됩니다.

## 10. 진단 결과 로직 수정

| 바꾸고 싶은 것 | 파일 |
| --- | --- |
| 질문·보기 문구, 보기별 점수, 질문 순서 | `src/lib/diagnostic/questions.ts` → `scoredQuestions` |
| Q8 관심 영역 보기 | `questions.ts` → `interestQuestion` (상담 폼 `INTEREST_OPTIONS`도 함께) |
| 타입 경계(11/8/4점) | `src/lib/diagnostic/scoring.ts` → `TYPE_THRESHOLDS` |
| 보정 규칙 | `scoring.ts` → `classify()` |
| '먼저 확인할 영역' 조건 | `scoring.ts` → `priorityTags()` |
| 결과 제목·본문·CTA 문구 | `questions.ts` → `resultCopy` |
| 영역 이름·설명 | `questions.ts` → `priorityLabels`, `priorityDescriptions` |

바꾼 뒤에는 `npm test`로 규칙 테스트(3⁸ = 6,561가지 조합 전수 검사 포함)를 돌리세요.

## 11. 업무 기반(회사·등록 정보) 수정 — ⚠️ 공개 전 필수

`src/config/profileAffiliations.ts`

```ts
{ category: "보험 · 절세", companyName: "키움에셋플래너", relationshipLabel: "", disclaimer: "", audience: "personal" }
{ category: "대출", companyName: "", relationshipLabel: "등록 대출상담사",
  registrationLabel: "등록번호", registrationNumber: "[LOAN_REGISTRATION_NUMBER]", audience: "personal" }
{ category: "사업자 정책자금", companyName: "하랑파트너스", relationshipLabel: "", audience: "business" }
```

- `relationshipLabel`은 실제 계약·위촉·등록 관계를 확인한 뒤에만 채웁니다. 비어 있으면 회사명만 담백하게 표시됩니다. '공식 파트너', '제휴', '소속', '전담' 같은 말을 임의로 넣지 마세요.
- `[LOAN_REGISTRATION_NUMBER]`처럼 대괄호로 된 값은 자리표시입니다. **배포 화면에서는 자동으로 숨겨지고**, 개발 화면(`npm run dev`)에서는 그대로 보여 눈에 띄게 합니다.
- 보험모집인·투자권유대행인·대출모집인 표시 기준(회사명·등록번호·문구 형식)은 각 회사와 협회 기준에 맞춰 최종 확정해야 합니다.
- 등록번호는 대출상담사(10-00054890)만 표기합니다. 그 외 자격의 등록번호는 운영자 결정에 따라 표기하지 않습니다.
- `audience: "business"`인 항목은 '사업을 하시는 경우' 문단에 따로 표시됩니다.

## 12. 황진 소개·사례·공유 문구 수정

| 바꾸고 싶은 것 | 위치 |
| --- | --- |
| 경력 연수(13년), 다루는 영역, 자격·등록 | `src/config/site.ts` → `profile` (자격은 실제 보유한 것만, 비우면 숨김) |
| 상담 사례 (처음 질문 / 먼저 본 것 / 정리한 방향) | `src/config/cases.ts` — 실제 사례로 바꿀 때는 본인 동의, 식별정보 제거, `sample: false`. 수익률·절감액 같은 성과 숫자는 쓰지 않습니다 |
| 사진 3장 (PHOTO 01 HERO 업무컷 · 02 프로필 · 03 상담 장면) | `public/images/`에 원본 JPG를 넣고 `src/config/site.ts` → `photos`의 `src`·`focus` 채우기 (`public/images/README.md` 참고). AVIF/WebP 자동 변환. 비어 있으면 배포 화면에서는 사진 자리를 숨기고(HERO는 데스크톱에서 메모 카드), 개발 화면이나 `NEXT_PUBLIC_SHOW_PHOTO_SLOTS=1`이면 '사진 자리'를 표시합니다 |
| (선택) B-roll 영상 1개 | `src/config/site.ts` → `brollVideo`의 `src`·`poster` 둘 다 채우면 상담 철학 섹션에 표시 (무음·화면에 보일 때만 재생·동작 줄이기 설정 존중) |
| 결과 화면 '이번 주에 해볼 간단한 행동' | `src/lib/diagnostic/questions.ts` → `priorityActions` |
| 지인 공유 문구·링크 구분값 | `src/config/site.ts` → `share` |
| 검색결과 제목·설명 | `src/config/site.ts` → `site.title`, `site.description` (화면에는 노출되지 않음) |
| '황진은 이런 일을 합니다' 영역 설명 | `src/components/home/sections.tsx` → `WORK` |
| 면책 문구 (푸터·이용안내) | `src/config/site.ts` → `compliance.pageNotice` |

---

## 1분 점검 알고리즘

- 화면 순서: 소득·지출 → 비상자금 → **대출 구조(금리·월 상환액·만기)** → 보험 → 은퇴 생활비 → 연금 수령액 → 투자 목적 → 큰돈 시기 → 관심 영역 (9문항)
- q1~q7: 보기별 2 / 1 / 0점, 최대 14점. 관심 영역(q8)은 점수 없이 태그로만 씁니다.
- 대출 문항(`debt`): '대부분 알고 있다'·'지금은 대출이 없다' 2점, '대략 알고 있다' 1점, '잘 모르겠다' 0점. **총점에는 넣지 않아** 원래의 11/8/4점 기준이 그대로 유지되고, 아래 보정 4와 '먼저 확인할 영역'에만 쓰입니다.
- 기본 타입: 11~14 **A** · 8~10 **B** · 4~7 **C** · 0~3 **D**
- 보정 (결과를 좋은 쪽으로는 올리지 않고, '먼저 정리할 쪽'으로만 내림)
  1. Q1 또는 Q2가 0점 → A 불가(최소 B)
  2. Q1과 Q2 모두 0점 → 최소 C
  3. Q1·Q2·Q3 중 2개 이상 0점 → D
  4. 대출 문항이 0점(금리·상환액·만기를 잘 모름) → A 불가(최소 B)
  - 참고: 2번에 해당하면 3번(0점 2개 이상)에도 항상 해당하므로 실제 결과는 D가 됩니다. 명세대로 두 규칙 모두 구현했습니다.
- 먼저 확인할 영역(최대 7개): Q1<2 또는 Q2<2 → 현금흐름/비상자금, 대출<2 → 대출/부채, Q5=0 또는 관심 영역이 퇴직연금 → 퇴직연금, Q3<2 → 보험, Q4<2 또는 Q5<2 → 연금/노후, Q6<2 → 투자 방향, Q7<2 → 생애자금 계획
- 결과 화면 순서: 결과 유형 → 지금 먼저 확인해볼 영역 → 이번 주에 해볼 간단한 행동(영역별 최대 3개) → "혼자 정리해봐도 괜찮고, 지금 상황을 편하게 이야기해도 됩니다." + 내 상황 편하게 이야기해보기
- 결과 화면은 '재무건전성·투자성향·적합성' 표현을 쓰지 않고 "지금 먼저 확인해볼 영역"으로만 안내하며, 참고용 고지를 함께 보여줍니다.

## 데이터 흐름과 개인정보

```
[1분 점검]  답변·결과 → 브라우저 sessionStorage (탭 닫으면 삭제, 서버 전송 없음)
                │
                │ 상담 신청 시, 본인이 '점검 결과 함께 보내기'를 켠 경우에만
                ▼
[상담 폼]   이름·연락처·관심 영역 (+선택 항목, 결과 유형·관심 영역·먼저 볼 영역, UTM)
                │ POST /api/consultation — 서버에서 다시 검증, 모르는 필드는 버림
                ▼
[Supabase]  consultations 테이블 (RLS 잠금, 서버 secret key로만 insert)
                │
                ▼
[운영자]    Supabase 대시보드 Table Editor에서 조회·상태/메모 관리

[GA4·Meta]  이벤트 이름 + 화이트리스트 파라미터만 (개인정보 없음)
```

- 받지 않는 정보: 주민등록번호, 계좌번호, 보험증권번호, 카드정보, 상세 자산금액. DB에 컬럼 자체가 없습니다.
- 개인정보 수집·이용 동의(필수)와 마케팅 수신 동의(선택)는 분리되어 있고, 마케팅 동의 없이도 신청됩니다.
- 스팸 방지: 숨김 필드(honeypot) + IP당 10분 5회 제한(인스턴스 단위).

## 디자인 메모

- 오프화이트 70 / 딥네이비 20 / 클로버그린 10.
- 텍스트 위계: 제목 `#18263D` → 핵심 강조 `#3F7D4A`(한 화면에 단어 1~2개) → 본문 `#4D535B` → 보조 `#858B91`(운영자 지정값). 보조색은 배경 대비 3.2:1로 WCAG AA(4.5:1)에 못 미쳐 Lighthouse 접근성이 100 → 96~97이 됩니다. 더 잘 읽히게 하려면 `src/app/globals.css`의 `--color-muted`를 `#656B71`(AA 통과)로 바꾸면 됩니다. 베이지 위 작은 그린 라벨은 `#2D5C36`.
- 네이비 배경: 제목 흰색, 본문 흰색 72%, 강조 `#A8D3AD`, 작은 라벨 `#8EBB96`.
- 버튼 역할: 주 행동 = 그린 채움, 모바일 하단 고정 = 네이비 채움, 보조 = 투명 + 네이비 테두리.
- 폰트: Pretendard. 사이트 문구에 쓰인 글자만 담은 106KB 파일 하나를 preload하고, 그 밖의 글자(사용자가 입력한 이름 등)는 동적 서브셋이 필요할 때만 받습니다. 문구를 많이 바꾸면 `python3 scripts/build-site-font.py <PretendardVariable.woff2>`로 다시 만드세요(안 해도 깨지지는 않습니다).
- **사진**: 현재는 사진 대신 '지금·다음·나중' 메모 카드가 HERO 비주얼입니다. 실제 사진은 `public/images/`에 넣고 `src/config/site.ts`의 `photos.hero.src`, `photos.about.src`를 채우면 자동으로 교체됩니다. 정장·팔짱 사진은 HERO에 쓰지 마세요.

## 검수 결과 (로컬 프로덕션 빌드)

| 항목 | 결과 |
| --- | --- |
| Lighthouse 모바일 `/` | Performance 95~96 · Accessibility 100 · SEO 100 · Best Practices 96* |
| Lighthouse 모바일 `/check` · `/contact` | 93 · 100 · 100 / 98 · 100 · 100 |
| 390×844, 393×873, 360×800, 1440 | 가로 스크롤 없음, 16px 미만 글자 없음, 44px 미만 터치 영역 없음 |
| E2E (Playwright) | 홈 10개 섹션·'황진 개인금융' 미노출·제목, 업무 기반 표기·자리표시 숨김, 공유(Web Share·복사 대체), 점검 9문항(대출 포함) 진행·이전 질문·뒤로/앞으로·새로고침 유지, 결과 타입·영역 칩(대출·퇴직연금)·이번 주 행동, 하단 고정 CTA, 문의 모달·폼 검증·동의·저장 행, GA/Meta 이벤트, 개인정보 미전송 등 70개 항목 통과 |
| 링크 | 내부 링크·앵커 22개 깨진 링크 없음 |
| 단위 테스트 | 15개 통과 |

\* 테스트 환경에서 GA·Meta 외부 스크립트가 차단되어 생긴 콘솔 오류 때문이며 실제 배포 환경과는 무관합니다.

## 추후 개선 후보

- 상담 신청 알림(운영자 카카오 알림톡·이메일). 외부 전송이 생기므로 처리방침의 위탁 항목을 함께 갱신해야 합니다.
- Supabase 대시보드 대신 간단한 운영자 화면(로그인 + 상태 변경).
- 결과 화면 A/B 테스트(CTA 문구, '순서 예시' 노출 여부).
- 짧은 B-roll 영상, 후기(동의받은 실제 사례만, 금융광고 심의 기준 확인 후). 실제 사진 3장은 반영 완료(라이프컷의 함께 선 분은 황진의 아버지, 게재 동의 받음).
- 자주 묻는 질문(상담 비용, 소요 시간, 상담 방식) — 운영 정책 확정 후 추가.
- 서버리스 환경에 맞는 분산 rate limit(Upstash 등), 필요 시 Turnstile.
- 쿠키 동의 배너(해외 유입 비중이 커질 경우).
