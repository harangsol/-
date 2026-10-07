import assert from "node:assert/strict";
import { test } from "node:test";
import { coerce, formatPhone, isValidMobile, validate } from "../src/lib/consultation/validate.ts";

const ok = {
  name: "홍길동",
  phone: "010-1234-5678",
  interest: "pension",
  ageRange: "",
  contactTime: "",
  concern: "",
  privacyConsent: true,
  marketingConsent: false,
};

test("정상 입력은 오류 없음 (마케팅 동의 없이도 가능)", () => {
  assert.deepEqual(validate(ok), {});
});

test("필수 항목과 필수 동의", () => {
  const e = validate({ ...ok, name: "", phone: "", interest: "", privacyConsent: false });
  assert.ok(e.name && e.phone && e.interest && e.privacyConsent);
});

test("휴대전화번호 형식", () => {
  assert.ok(isValidMobile("01012345678"));
  assert.ok(isValidMobile("011-123-4567"));
  assert.ok(!isValidMobile("02-123-4567"));
  assert.ok(!isValidMobile("010-12"));
  assert.equal(formatPhone("01012345678"), "010-1234-5678");
  assert.equal(formatPhone("0111234567"), "011-123-4567");
});

test("고민은 200자 이내", () => {
  assert.ok(validate({ ...ok, concern: "가".repeat(201) }).concern);
  assert.equal(validate({ ...ok, concern: "가".repeat(200) }).concern, undefined);
});

test("coerce 는 모르는 필드와 잘못된 값을 버린다", () => {
  const c = coerce({
    ...ok,
    privacyConsent: "true",
    ssn: "900101-1234567",
    ageRange: "100대",
    result: { type: "Z", tags: ["x"] },
  });
  assert.equal(c.privacyConsent, false);
  assert.equal(c.ageRange, "");
  assert.equal(c.result, null);
  assert.ok(!("ssn" in c));
  const c2 = coerce({ ...ok, result: { type: "B", interest: "pension", tags: ["cashflow", "evil"] } });
  assert.deepEqual(c2.result, { type: "B", interest: "pension", tags: ["cashflow"] });
});
