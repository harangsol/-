# 하랑솔 작업 저장소

| 폴더 | 내용 |
|---|---|
| [`bid-alert/`](bid-alert/) | **나라장터 맞춤 입찰공고 알림.** 평일 아침 7시에 고객별 조건에 맞는 입찰공고를 메일로 자동 발송하는 구독형 서비스. 설정 방법은 [`bid-alert/README.md`](bid-alert/README.md), 판매 계획은 [`bid-alert/sales/`](bid-alert/sales/) |
| [`ebook/`](ebook/) | **전자책 「나라장터 첫 입찰 가이드」.** A5 24쪽 PDF와 원고. 판매하거나 알림 서비스 고객 모집용으로 무료 배포. 판매 전에 [`ebook/FACT-CHECK.md`](ebook/FACT-CHECK.md)를 읽어 주세요 |
| [`docs/`](docs/) | B2B 솔루션 기업 웹사이트 구축 기획서 |
| [`.github/workflows/`](.github/workflows/) | 알림 자동 발송(`bid-alert.yml`), 코드 변경 시 테스트(`bid-alert-ci.yml`) |

## 처음 할 일

1. 공공데이터포털(data.go.kr)에서 "조달청_나라장터 입찰공고정보서비스"를 활용신청합니다(승인까지 시간이 걸릴 수 있음).
2. 저장소를 비공개로 바꾸고, `bid-alert/README.md` 4절대로 시크릿을 등록합니다.
3. Actions → "입찰공고 아침 알림" → Run workflow(`dry_run` 체크)로 시험합니다.
4. 본인 회사를 첫 고객으로 넣어 1주일 받아 본 뒤 판매를 시작합니다.
