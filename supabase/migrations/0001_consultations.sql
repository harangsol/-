-- 황진 개인금융 — 상담 신청 테이블
-- Supabase 대시보드 > SQL Editor 에 붙여 넣어 실행한다.
--
-- 원칙
--   * 상담 연락에 필요한 최소 정보만 저장한다.
--   * 주민등록번호, 계좌번호, 보험증권번호, 카드정보, 상세 자산금액 컬럼은 만들지 않는다.
--   * RLS 를 켜고 정책을 만들지 않는다 → anon/authenticated 키로는 읽기·쓰기 모두 불가.
--     서버(api/consultation)가 service role / secret key 로만 insert 한다.
--   * 운영자는 Supabase 대시보드 Table Editor 에서 조회한다.

create table if not exists public.consultations (
  id                     uuid primary key default gen_random_uuid(),
  created_at             timestamptz not null default now(),

  -- 필수
  name                   text not null check (char_length(name) between 2 and 40),
  phone                  text not null check (phone ~ '^01[016789][0-9]{7,8}$'),
  interest_area          text not null,

  -- 선택
  age_range              text,
  contact_time           text,
  concern                text check (concern is null or char_length(concern) <= 200),

  -- 동의
  privacy_consent        boolean not null default true,
  privacy_policy_version text not null,
  marketing_consent      boolean not null default false,

  -- 1분 점검 결과 요약 (본인이 함께 보내기를 선택한 경우)
  result_type            text check (result_type is null or result_type in ('A','B','C','D')),
  result_interest_area   text,
  priority_tags          text[],

  -- 유입 경로 (캠페인 구분값만)
  utm_source             text,
  utm_medium             text,
  utm_campaign           text,
  landing_path           text,

  -- 운영 메모 (대시보드에서 직접 입력)
  status                 text not null default 'new' check (status in ('new','contacted','done','dropped')),
  memo                   text
);

create index if not exists consultations_created_at_idx on public.consultations (created_at desc);

alter table public.consultations enable row level security;
-- 정책을 일부러 만들지 않는다.

-- 보유기간 경과 데이터 파기 (src/config/privacy.ts 의 retentionDays 와 같은 값으로 맞춘다)
create or replace function public.purge_expired_consultations(retention_days integer default 365)
returns integer
language sql
security definer
set search_path = public
as $$
  with deleted as (
    delete from public.consultations
    where created_at < now() - make_interval(days => retention_days)
    returning 1
  )
  select count(*)::integer from deleted;
$$;

revoke all on function public.purge_expired_consultations(integer) from public, anon, authenticated;

-- 매일 자동 파기를 원하면 Database > Extensions 에서 pg_cron 을 켠 뒤 아래를 실행한다.
-- select cron.schedule('purge-consultations', '17 3 * * *', $$select public.purge_expired_consultations(365)$$);
