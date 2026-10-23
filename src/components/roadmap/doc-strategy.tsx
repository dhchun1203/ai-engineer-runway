import { Check, CircleDashed } from "lucide-react";
import {
  docPrinciples,
  docStrategyIntro,
  requirementEvidence,
} from "@/content/channeltalk-roadmap";
import { PrepLinks } from "@/components/roadmap/prep-links";

// 비전공자 서류 대비 전략. 필수 자격 한 줄마다 "지금 있는 증거"와 "만들 증거"를 나란히
// 놓고, 이 로드맵의 어느 단계로 준비하는지 바로가기를 단다. 아래에는 서류를 쓰는 원칙.
// 전공 줄(마지막 필수 자격)은 행동색 왼쪽 선으로 따로 짚는다.
export function DocStrategy() {
  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-2xl break-keep text-body font-normal leading-relaxed text-badge-neutral-text dark:text-badge-neutral-text-dark">
        {docStrategyIntro}
      </p>

      {/* 필수 자격 한 줄씩: 있는 증거 / 만들 증거 */}
      <ol className="flex flex-col gap-4">
        {requirementEvidence.map((row, index) => {
          const isDegree = index === requirementEvidence.length - 1;
          return (
            <li
              key={row.requirement}
              className={`panel card-hover-grow flex flex-col gap-4 p-5 ${
                isDegree ? "border-l-4 border-l-action dark:border-l-action-dark" : ""
              }`}
            >
              <div className="flex flex-col gap-1">
                <span className="text-label font-bold text-badge-neutral-text dark:text-badge-neutral-text-dark">
                  필수 자격 {index + 1}
                </span>
                <h3 className="break-keep text-body font-extrabold">{row.requirement}</h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <span className="text-label font-bold text-ok dark:text-ok-dark">지금 있는 증거</span>
                  {row.have.length > 0 ? (
                    <ul className="flex flex-col gap-1.5">
                      {row.have.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-label leading-relaxed">
                          <Check
                            className="mt-0.5 h-4 w-4 shrink-0 text-ok dark:text-ok-dark"
                            aria-hidden="true"
                          />
                          <span className="break-keep">{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-label font-normal text-badge-neutral-text dark:text-badge-neutral-text-dark">
                      아직 없어요. 오른쪽부터 만들어요.
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-label font-bold text-action dark:text-action-dark">만들 증거</span>
                  <ul className="flex flex-col gap-1.5">
                    {row.make.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-label leading-relaxed">
                        <CircleDashed
                          className="mt-0.5 h-4 w-4 shrink-0 text-action dark:text-action-dark"
                          aria-hidden="true"
                        />
                        <span className="break-keep">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <PrepLinks ids={row.prep} />
            </li>
          );
        })}
      </ol>

      {/* 서류를 쓰는 원칙 */}
      <div className="flex flex-col gap-3">
        <h3 className="text-subhead font-extrabold break-keep">서류를 쓰는 원칙</h3>
        <ol className="grid gap-4 sm:grid-cols-2">
          {docPrinciples.map((principle, index) => (
            <li key={principle.title} className="panel card-hover-grow flex flex-col gap-2 p-5">
              <span className="text-label font-black tabular-nums text-accent dark:text-accent-dark">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h4 className="break-keep text-body font-extrabold">{principle.title}</h4>
              <p className="break-keep text-label font-normal leading-relaxed">{principle.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
