import localFont from "next/font/local";

export const pretendard = localFont({
  // 08-04: 풀세트(2.0MB, 한자·가나 포함) 대신 서브셋 파일을 가리킨다 — 서브셋 여부와
  // 무관한 variable/weight/display는 그대로 둔다. 원본은 assets/fonts/에 보존돼 있다.
  src: "../../public/fonts/PretendardVariable.subset.woff2",
  variable: "--font-pretendard",
  weight: "45 920", // variable font axis range, not 9 discrete static files
  display: "swap",
});
