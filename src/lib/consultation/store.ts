import "server-only";

import { privacyConfig } from "@/config/privacy";
import { normalizePhone, type ConsultationInput } from "./validate";

/**
 * 상담 신청 저장소 — Supabase(PostgreSQL) REST API.
 *
 * SDK 없이 fetch 한 번으로 insert 한다. 키는 서버 전용 환경변수로만 읽고,
 * 테이블은 RLS 로 막혀 있어 브라우저에서는 읽거나 쓸 수 없다.
 * (supabase/migrations/0001_consultations.sql 참고)
 */

export type StoreOutcome = { ok: true } | { ok: false; reason: "not_configured" | "upstream_error" };

export function isStoreConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function saveConsultation(input: ConsultationInput): Promise<StoreOutcome> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const row = {
    name: input.name.trim(),
    phone: normalizePhone(input.phone),
    interest_area: input.interest,
    age_range: input.ageRange || null,
    contact_time: input.contactTime || null,
    concern: input.concern.trim() || null,
    privacy_consent: true,
    privacy_policy_version: privacyConfig.version,
    marketing_consent: input.marketingConsent,
    result_type: input.result?.type ?? null,
    result_interest_area: input.result?.interest || null,
    priority_tags: input.result?.tags ?? null,
    utm_source: input.attribution?.utm_source ?? null,
    utm_medium: input.attribution?.utm_medium ?? null,
    utm_campaign: input.attribution?.utm_campaign ?? null,
    landing_path: input.attribution?.landing_path ?? null,
  };

  if (!url || !key) {
    if (process.env.NODE_ENV !== "production") {
      // 로컬 개발 편의: 저장소 없이도 폼 흐름을 확인할 수 있게 한다. 개인정보는 로그에 남기지 않는다.
      console.info("[consultation] (dev, not stored)", {
        interest_area: row.interest_area,
        result_type: row.result_type,
        priority_tags: row.priority_tags,
      });
      return { ok: true };
    }
    return { ok: false, reason: "not_configured" };
  }

  const headers: Record<string, string> = {
    apikey: key,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  };
  // 레거시 service_role 키(JWT)는 Authorization 헤더도 필요하다. 새 sb_secret_ 키는 apikey 만으로 충분하다.
  if (key.startsWith("eyJ")) headers.Authorization = `Bearer ${key}`;

  try {
    const res = await fetch(`${url.replace(/\/+$/, "")}/rest/v1/consultations`, {
      method: "POST",
      headers,
      body: JSON.stringify(row),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("[consultation] supabase insert failed", res.status, (await res.text()).slice(0, 300));
      return { ok: false, reason: "upstream_error" };
    }
    return { ok: true };
  } catch (err) {
    console.error("[consultation] supabase request error", err instanceof Error ? err.message : err);
    return { ok: false, reason: "upstream_error" };
  }
}
