// 영상 전체 타이밍(초). 화면(index.html)과 음악(score.py)이 같은 값을 읽는다.
// 이 파일은 JSON 규칙(큰따옴표, 끝 쉼표 없음)을 지켜야 score.py가 읽을 수 있다.
window.CUES = {
  "fps": 30,
  "duration": 39.0,
  "bpm": 120,

  "hook":       { "start": 0.0,  "leak": 1.75, "out": 3.6 },
  "pain":       { "start": 4.0,  "checks": [4.5, 5.0, 5.5, 6.0, 6.5, 7.0], "line1": 7.9, "line2": 8.4, "out": 9.6 },
  "notonly":    { "start": 10.0, "lines": [10.0, 10.45, 10.9, 11.35], "strike": 0.22, "close": 11.9, "out": 12.6 },
  "reveal":     { "start": 13.0, "drop": 14.0, "logo": 14.7, "out": 15.6 },
  "stages":     { "start": 16.0, "each": 2.0 },
  "overview":   { "start": 24.0, "text": 24.55, "out": 25.5 },
  "principles": { "start": 26.0, "lines": [26.2, 27.45, 28.7], "out": 29.8 },
  "process":    { "start": 30.0, "steps": [30.3, 30.8, 31.3, 31.8, 32.3], "network": 32.9, "out": 33.75 },
  "cta":        { "start": 34.0, "logo": 34.7, "button": 35.2, "tap": 36.0, "end": 39.0 }
};
