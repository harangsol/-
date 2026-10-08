// 공개 전 점검: 아직 채워지지 않은 회사·등록 정보, 사진, 연락 채널을 보여준다.
// 사용: npm run check:launch          (목록만 출력)
//       npm run check:launch -- --strict  (빠진 값이 있으면 실패 코드로 종료 — 배포 전 CI 용)
import { readFileSync, existsSync } from "node:fs";

const root = new URL("..", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");
const problems = [];

// 1) 업무 기반(회사·등록 정보)
const aff = read("src/config/profileAffiliations.ts");
const body = aff.slice(aff.indexOf("export const profileAffiliations"));
for (const block of body.split(/\n  \{\n/).slice(1)) {
  const get = (k) => (block.match(new RegExp(`${k}: "([^"]*)"`)) || [])[1];
  const name = `${get("category")} ${get("companyName") || ""}`.trim();
  for (const [k, v] of Object.entries({ relationshipLabel: get("relationshipLabel"), registrationNumber: get("registrationNumber") })) {
    if (v === undefined) continue;
    if (/^\[[A-Z0-9_]+\]$/.test(v)) problems.push(`[업무 기반] ${name} — ${k} 자리표시 ${v} (배포 화면에서는 숨겨짐)`);
    else if (v === "") problems.push(`[업무 기반] ${name} — ${k} 비어 있음 (회사와의 실제 관계 확인 후 입력)`);
  }
}

// 2) 사진
const site = read("src/config/site.ts");
const photoBlock = site.slice(site.indexOf("export const photos"));
for (const key of ["hero", "about", "life"]) {
  const m = photoBlock.match(new RegExp(`${key}: \\{[\\s\\S]*?src: "([^"]*)"`));
  if (!m || !m[1]) problems.push(`[사진] photos.${key}.src 비어 있음`);
  else if (!existsSync(new URL(`public${m[1]}`, root))) problems.push(`[사진] photos.${key}.src 파일 없음: public${m[1]}`);
}

// 3) 경력·자격
if (/credentials: \[\] as string\[\]/.test(site)) problems.push("[프로필] profile.credentials 비어 있음 (보유 자격이 있으면 입력, 없으면 무시)");
problems.push(`[프로필] profile.careerYears = ${(site.match(/careerYears: (\d+)/) || [])[1]} — 실제 경력과 맞는지 확인`);


// 4) 환경변수 (현재 셸/.env.local 기준)
let env = { ...process.env };
if (existsSync(new URL(".env.local", root))) {
  for (const line of read(".env.local").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !env[m[1]]) env[m[1]] = m[2];
  }
}
for (const k of ["NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_KAKAO_CONTACT_URL", "NEXT_PUBLIC_PHONE", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "NEXT_PUBLIC_GA_MEASUREMENT_ID", "NEXT_PUBLIC_META_PIXEL_ID", "NEXT_PUBLIC_PRIVACY_EMAIL"]) {
  if (!env[k]) problems.push(`[환경변수] ${k} 비어 있음 (Vercel 환경변수에 입력했다면 무시)`);
}

console.log(problems.length ? `공개 전 확인할 항목 ${problems.length}개\n- ` + problems.join("\n- ") : "확인할 항목이 없습니다.");
const blocking = problems.filter((p) => p.startsWith("[업무 기반]") && p.includes("자리표시"));
if (process.argv.includes("--strict") && blocking.length) process.exit(1);
