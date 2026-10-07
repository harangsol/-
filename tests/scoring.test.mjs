// 실행: npm test  (Node 22 내장 테스트 러너 + TypeScript 타입 제거 기능 사용, 외부 의존성 없음)
import assert from "node:assert/strict";
import { test } from "node:test";
import { baseType, classify, MAX_SCORE, priorityTags } from "../src/lib/diagnostic/scoring.ts";

const s = (q1, q2, q3, q4, q5, q6, q7) => ({ q1, q2, q3, q4, q5, q6, q7 });

test("최대 점수는 14점", () => assert.equal(MAX_SCORE, 14));

test("총점 구간별 기본 타입", () => {
  assert.equal(baseType(14), "A");
  assert.equal(baseType(11), "A");
  assert.equal(baseType(10), "B");
  assert.equal(baseType(8), "B");
  assert.equal(baseType(7), "C");
  assert.equal(baseType(4), "C");
  assert.equal(baseType(3), "D");
  assert.equal(baseType(0), "D");
});

test("만점은 A, 0점은 D", () => {
  assert.deepEqual(classify(s(2, 2, 2, 2, 2, 2, 2)), { total: 14, type: "A" });
  assert.deepEqual(classify(s(0, 0, 0, 0, 0, 0, 0)), { total: 0, type: "D" });
});

test("보정1: Q1 또는 Q2가 0점이면 A가 될 수 없다", () => {
  assert.deepEqual(classify(s(0, 2, 2, 2, 2, 2, 2)), { total: 12, type: "B" });
  assert.deepEqual(classify(s(2, 0, 2, 2, 2, 2, 2)), { total: 12, type: "B" });
  // 이미 B 이하라면 그대로
  assert.equal(classify(s(0, 2, 2, 1, 1, 1, 1)).type, "B");
});

test("보정2+3: Q1·Q2 모두 0점이면 (Q1~Q3 중 0점이 2개 이상이므로) D", () => {
  assert.deepEqual(classify(s(0, 0, 2, 2, 2, 2, 2)), { total: 10, type: "D" });
});

test("보정3: Q1·Q2·Q3 중 2개 이상 0점이면 D", () => {
  assert.equal(classify(s(0, 2, 0, 2, 2, 2, 2)).type, "D");
  assert.equal(classify(s(2, 0, 0, 2, 2, 2, 2)).type, "D");
  // 하나만 0점이면 D 강제 아님
  assert.equal(classify(s(2, 2, 0, 2, 2, 2, 2)).type, "A");
});

test("보정은 결과를 좋은 쪽으로 올리지 않는다", () => {
  // 총점 3점(D)인데 Q1~Q3 에 0점이 없어도 D 유지
  assert.equal(classify(s(1, 1, 1, 0, 0, 0, 0)).type, "D");
});

test("먼저 확인할 영역 태그", () => {
  assert.deepEqual(priorityTags(s(2, 2, 2, 2, 2, 2, 2)), []);
  assert.deepEqual(priorityTags(s(1, 2, 2, 2, 2, 2, 2)), ["cashflow"]);
  assert.deepEqual(priorityTags(s(2, 1, 1, 2, 1, 0, 1)), ["cashflow", "insurance", "pension", "investment", "lifeplan"]);
  assert.deepEqual(priorityTags(s(2, 2, 2, 1, 2, 2, 2)), ["pension"]);
});

test("모든 3^7 조합에서 타입이 정의되고 규칙을 지킨다", () => {
  let n = 0;
  const vals = [0, 1, 2];
  for (const a of vals) for (const b of vals) for (const c of vals) for (const d of vals)
    for (const e of vals) for (const f of vals) for (const g of vals) {
      const r = classify(s(a, b, c, d, e, f, g));
      n++;
      assert.ok(["A", "B", "C", "D"].includes(r.type));
      if (a === 0 || b === 0) assert.notEqual(r.type, "A");
      if (a === 0 && b === 0) assert.ok(r.type === "C" || r.type === "D");
      if ([a, b, c].filter((x) => x === 0).length >= 2) assert.equal(r.type, "D");
    }
  assert.equal(n, 2187);
});
