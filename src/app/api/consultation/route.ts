import { saveConsultation } from "@/lib/consultation/store";
import { coerce, validate } from "@/lib/consultation/validate";

/**
 * 상담 신청 접수 API.
 * - 입력은 서버에서 다시 검증한다.
 * - 개인정보는 로그와 분석 도구에 남기지 않는다.
 */

// 같은 IP에서 짧은 시간에 반복 제출하는 것을 막는 최소한의 장치(인스턴스 단위, best-effort).
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > MAX_PER_WINDOW;
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return Response.json({ ok: false, error: "too_many_requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const input = coerce(body);

  // 숨김 필드가 채워졌다면 봇으로 보고 조용히 성공 처리한다.
  if (input.website) return Response.json({ ok: true });

  const errors = validate(input);
  if (Object.keys(errors).length > 0) {
    return Response.json({ ok: false, error: "validation", fields: errors }, { status: 422 });
  }

  const outcome = await saveConsultation(input);
  if (!outcome.ok) {
    return Response.json(
      { ok: false, error: outcome.reason },
      { status: outcome.reason === "not_configured" ? 503 : 502 },
    );
  }
  return Response.json({ ok: true });
}
