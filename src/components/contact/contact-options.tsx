"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { contact, phoneHref } from "@/config/site";
import { track } from "@/lib/analytics";

type Props = {
  /** 이벤트에 붙일 위치 값 (result_dialog, contact_page 등) */
  location: string;
  /** 상담신청 폼으로 가는 대신 같은 페이지의 폼으로 스크롤할 때 */
  onFormSelect?: () => void;
  resultType?: string;
};

/** 연락 방법 3가지: 카카오톡 / 연락처 남기기 / 전화. 설정되지 않은 채널은 숨긴다. */
export function ContactOptions({ location, onFormSelect, resultType }: Props) {
  const params = { location, ...(resultType ? { result_type: resultType } : {}) };
  const option = (method: "kakao" | "form" | "phone") => track("contact_option_click", { ...params, method });
  return (
    <ul className="space-y-3">
      {contact.kakaoUrl && (
        <li>
          <a
            href={contact.kakaoUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              option("kakao");
              track("kakao_contact_click", params);
            }}
            className={optionClass}
          >
            <OptionBody
              icon={<KakaoIcon />}
              title="카카오톡으로 물어보기"
              desc="가볍게 메시지로 먼저 물어보고 싶을 때"
            />
          </a>
        </li>
      )}
      <li>
        {onFormSelect ? (
          <button
            type="button"
            onClick={() => {
              option("form");
              onFormSelect();
            }}
            className={optionClass}
          >
            <OptionBody icon={<FormIcon />} title="내 상황 한번 얘기해보기" desc="이름과 연락처만 남기면 편한 시간에 연락드려요" />
          </button>
        ) : (
          <Link href="/contact#form" onClick={() => option("form")} className={optionClass}>
            <OptionBody icon={<FormIcon />} title="내 상황 한번 얘기해보기" desc="이름과 연락처만 남기면 편한 시간에 연락드려요" />
          </Link>
        )}
      </li>
      {contact.phone && (
        <li>
          <a href={phoneHref(contact.phone)} onClick={() => {
              option("phone");
              track("phone_contact_click", params);
            }} className={optionClass}>
            <OptionBody icon={<PhoneIcon />} title="전화로 물어보기" desc={contact.phone} />
          </a>
        </li>
      )}
    </ul>
  );
}

const optionClass =
  "group flex min-h-[4.5rem] w-full items-center gap-4 rounded-[10px] border border-navy/15 bg-white px-5 py-4 text-left transition-colors hover:border-navy/50";

function OptionBody({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
  return (
    <>
      <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-full bg-paper text-navy">
        {icon}
      </span>
      <span className="flex-1">
        <span className="block text-[1.0625rem] font-semibold text-navy">{title}</span>
        <span className="mt-0.5 block text-base leading-snug text-muted">{desc}</span>
      </span>
      <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5 shrink-0 text-navy/40 transition-transform group-hover:translate-x-0.5" fill="none">
        <path d="M7.5 4.5 13 10l-5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </>
  );
}

function KakaoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
      <path d="M12 4C7 4 3 7.1 3 11c0 2.5 1.7 4.7 4.2 6l-.9 3.3c-.1.3.3.6.6.4l3.9-2.6c.4 0 .8.1 1.2.1 5 0 9-3.1 9-7s-4-7.2-9-7.2Z" />
    </svg>
  );
}
function FormIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <rect x="5" y="3.5" width="14" height="17" rx="2" />
      <path d="M9 9h6M9 13h6M9 17h3" />
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
      <path d="M6.5 3.5h3l1.5 4-2 1.5a11 11 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 4.5 5.5a2 2 0 0 1 2-2Z" />
    </svg>
  );
}
