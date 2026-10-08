import Link from "next/link";
import { Arrow, buttonClass, Container } from "@/components/ui/primitives";

export default function NotFound() {
  return (
    <Container className="flex min-h-[80dvh] max-w-[36rem] flex-col justify-center pb-20 pt-28">
      <p className="text-base font-semibold text-green">404</p>
      <h1 className="mt-3 text-[1.75rem] font-bold text-navy sm:text-[2.25rem]">찾으시는 페이지가 없어요.</h1>
      <p className="mt-4 text-muted">주소가 바뀌었거나 잘못 입력된 것 같아요. 아래에서 다시 시작해보세요.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/check" className={buttonClass("primary", "sm:px-8")}>
          1분 금융점검 하기
          <Arrow />
        </Link>
        <Link href="/" className={buttonClass("outline", "sm:px-8")}>
          처음으로
        </Link>
      </div>
    </Container>
  );
}
