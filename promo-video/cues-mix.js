// 섞은 영상(38초) 타이밍: 사람 장면(힉스필드) + 모션그래픽. mix.html 과 score_mix.py 가 같이 읽는다. JSON 규칙을 지킬 것.
window.CUES = {
  "fps": 30,
  "duration": 38.0,
  "bpm": 120,

  "footage": {
    "hook":    { "frames": 101, "start": 0.0,  "speed": 0.84 },
    "cafe":    { "frames": 101, "start": 4.0,  "speed": 1.0 },
    "consult": { "frames": 137, "start": 18.0, "speed": 1.0 }
  },

  "hook":     { "start": 0.0,  "line3": 1.5, "mark": 2.0, "out": 4.0 },
  "cafe":     { "start": 4.0,  "line1": 4.15, "line2": 5.4, "out": 7.2 },
  "funds":    { "start": 7.2,  "main": 7.5, "chips": 8.3, "out": 9.3 },
  "maze":     { "start": 9.5,  "chips": 9.6, "chipStep": 0.13, "line1": 10.1, "line2": 11.0, "out": 13.3 },
  "order":    { "start": 13.5, "drop": 14.0, "sub": 15.6, "out": 17.7 },
  "diagnose": { "start": 18.0, "rows": [18.5, 18.95, 19.4, 19.85, 20.3], "result": 21.1, "out": 23.75 },
  "honest":   { "start": 24.0, "no": 25.7, "line": 26.6, "chips": 28.2, "out": 29.75 },
  "cta":      { "start": 30.0, "question": 30.4, "button": 31.4, "guide": 32.0, "tap": 33.0, "final": 36.0, "end": 38.0 },

  "vo": [
    { "id": "M1", "at": 0.1,  "end": 3.95, "text": "사장님, 정책자금은 우리 가게와 상관없다고 생각하셨나요?" },
    { "id": "M2", "at": 4.1,  "end": 9.4,  "text": "창업한 지 얼마 안 됐어도, 운영 중이어도, 검토할 수 있는 자금이 있습니다." },
    { "id": "M3", "at": 9.6,  "end": 13.3, "text": "그런데 종류도 많고, 기관마다 조건도 다릅니다." },
    { "id": "M4", "at": 13.9, "end": 17.95, "text": "순서부터 정리합니다. 기관별, 지역별 자금을 함께 봅니다.", "same_as": "fund/F3" },
    { "id": "M5", "at": 18.1, "end": 23.9, "text": "업종, 매출, 업력, 신용, 부채를 먼저 보고, 어떤 자금을 어떤 순서로 볼지 정합니다.", "same_as": "fund/F4" },
    { "id": "M6", "at": 24.1, "end": 30.0, "text": "정책자금, 무조건 되나요? 아닙니다. 되는 것과 어려운 것, 먼저 구분해 드립니다.", "same_as": "fund/F6" },
    { "id": "M7", "at": 30.2, "end": 37.6, "text": "우리 가게도 대상이 될까요? 무료로 진단받아 보세요. 아래 더 알아보기를 눌러 주세요." }
  ]
};
