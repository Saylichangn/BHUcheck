import type { Metadata } from "next";
import { Landscape } from "@/components/landscape";
import { Notice } from "@/components/ui";
import { QuestionnaireSection } from "@/components/questionnaire-section";

export const metadata: Metadata = {
  title: "Questionnaire",
};

export default function QuestionnairePage() {
  return (
    <div>
      <section className="page-hero">
        <Landscape />
        <div className="page-shell">
          <div className="pb-12 pt-10 sm:pb-14">
            <p className="eyebrow text-lime">Before you pay</p>
            <h1 className="mt-5 text-[clamp(3rem,8vw,6.5rem)] leading-[0.9]">
              Questionnaire
            </h1>
            <p className="mt-6 max-w-2xl text-[15px] leading-[1.7] text-paper/70">
              Work through these checks before paying a token amount. You do not
              need an account to use this page; answers here are not saved. Sign
              in and add them to an investigation to keep them.
            </p>
          </div>
        </div>
      </section>

      <div className="page-shell page-body">
        <Notice tone="warn" title="Scope">
          This is a list of questions and starting points, not legal advice or a
          conclusion about any property. Confirm everything with the issuing
          authority and a qualified professional.
        </Notice>

        <div className="mt-12">
          <QuestionnaireSection />
        </div>
      </div>
    </div>
  );
}
