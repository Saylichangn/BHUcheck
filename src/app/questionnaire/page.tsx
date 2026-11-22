import type { Metadata } from "next";
import { Notice } from "@/components/ui";
import { QuestionnaireSection } from "@/components/questionnaire-section";

export const metadata: Metadata = {
  title: "Questionnaire",
};

export default function QuestionnairePage() {
  return (
    <div>
      <p className="mono-label">Before you pay</p>
      <h1 className="mt-2 text-3xl">Questionnaire</h1>
      <p className="mt-2 max-w-3xl text-sm text-muted">
        Work through these checks before paying a token amount. You do not need
        an account to use this page; answers here are not saved. Sign in and add
        them to an investigation to keep them.
      </p>

      <div className="mt-6">
        <Notice tone="warn" title="Scope">
          This is a list of questions and starting points, not legal advice or a
          conclusion about any property. Confirm everything with the issuing
          authority and a qualified professional.
        </Notice>
      </div>

      <div className="mt-8">
        <QuestionnaireSection />
      </div>
    </div>
  );
}
