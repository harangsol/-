"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button, buttonClass, Container } from "@/components/ui/primitives";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="flex min-h-[80dvh] max-w-[36rem] flex-col justify-center pb-20 pt-28">
      <h1 className="text-[1.75rem] font-bold text-navy">잠시 문제가 생겼어요.</h1>
      <p className="mt-4 text-muted">다시 시도해도 같은 화면이 보이면 잠시 후 다시 들어와주세요.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button onClick={reset} className="sm:px-8">
          다시 시도
        </Button>
        <Link href="/" className={buttonClass("outline", "sm:px-8")}>
          처음으로
        </Link>
      </div>
    </Container>
  );
}
