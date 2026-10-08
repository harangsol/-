"use client";

import { useSyncExternalStore } from "react";
import { getResultSnapshot, subscribeStorage, type StoredResult } from "./storage";

/** sessionStorage 에 저장된 1분 점검 결과. 서버 렌더링 중에는 undefined(아직 모름). */
export function useStoredResult(): StoredResult | null | undefined {
  return useSyncExternalStore(subscribeStorage, getResultSnapshot, () => undefined);
}
