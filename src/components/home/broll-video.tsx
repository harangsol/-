"use client";

import { useEffect, useRef, useState } from "react";
import { brollVideo } from "@/config/site";

/**
 * (선택) 8~12초 B-roll 영상 1개.
 * - src·poster 가 모두 있을 때만 그린다. 없으면 아무것도 그리지 않는다(사진으로 대체).
 * - 소리 없음(muted) · playsInline · loop · preload="none"
 * - 화면에 들어왔을 때만 불러와 재생하고, 벗어나면 멈춘다.
 * - '동작 줄이기' 설정 사용자에게는 자동재생하지 않고 poster 와 재생 버튼만 보여준다.
 */
export function BrollVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  const [reduced, setReduced] = useState(false);
  const [playing, setPlaying] = useState(false);
  const enabled = Boolean(brollVideo.src && brollVideo.poster);

  useEffect(() => {
    const v = ref.current;
    if (!enabled || !v) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    if (mq.matches) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.4 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, [enabled]);

  if (!enabled) return null;

  return (
    <figure className="relative mt-12 overflow-hidden rounded-[6px] bg-navy-soft sm:mt-16">
      <video
        ref={ref}
        className="aspect-[16/9] w-full object-cover"
        src={brollVideo.src}
        poster={brollVideo.poster}
        muted
        playsInline
        loop
        preload="none"
        aria-label="황진이 자료를 보고 메모하는 모습"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy/85 to-navy/0 px-5 pb-5 pt-16 sm:px-8 sm:pb-7">
        <p className="text-[1.125rem] font-bold leading-[1.5] text-white sm:text-[1.375rem]">
          {brollVideo.caption[0]}
          <br />
          {brollVideo.caption[1]}
        </p>
      </figcaption>
      {reduced && !playing && (
        <button
          type="button"
          onClick={() => ref.current?.play()}
          className="absolute right-4 top-4 flex min-h-11 items-center rounded-full bg-white/90 px-4 text-base font-semibold text-navy"
        >
          영상 재생
        </button>
      )}
    </figure>
  );
}
