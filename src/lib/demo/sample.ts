import type { AlertLevel } from "@/lib/domain/alerts";

export type SampleDocument = {
  type: string;
  name: string;
  size: string;
  pages: number;
  uploadedAt: string;
  text: string;
  fields: number;
  note: string | null;
};

export type SampleClaim = {
  text: string;
  field: string;
  stated: string;
  result: string;
  basis: string;
};

export type SampleAlert = {
  level: AlertLevel;
  tag: string;
  title: string;
  explanation: string;
  why: string;
  next: string;
  source: string;
  statement: string | null;
};

export type SampleChecklistItem = {
  group: string;
  label: string;
  checked: boolean;
  authority: string;
  note: string;
};

export const sampleInvestigation = {
  nickname: "Kothrud plot — Deshmukh",
  district: "Pune",
  taluka: "Haveli",
  village: "Kothrud",
  surveyNo: "123/2",
  propertyType: "Plot / land",
  intendedUse: "Residential",
  documents: [
    {
      type: "7/12",
      name: "7-12 extract June 2025.pdf",
      size: "178 KB",
      pages: 2,
      uploadedAt: "02 Jun 2026",
      text: "Text read",
      fields: 9,
      note: null,
    },
    {
      type: "Sale deed",
      name: "sale deed 2019.pdf",
      size: "1.2 MB",
      pages: 12,
      uploadedAt: "03 Jun 2026",
      text: "Read with OCR",
      fields: 6,
      note: "OCR output should be checked against the uploaded copy.",
    },
  ] satisfies SampleDocument[],
  claims: [
    {
      text: "The plot is 2,000 sq ft and has no mortgage.",
      field: "Area",
      stated: "2,000 sq ft",
      result: "Contradicted",
      basis: "The 7/12 extract records 1.20 hectare.",
    },
    {
      text: "The seller is the recorded holder.",
      field: "Owner name",
      stated: "Ram Patil",
      result: "Unverified",
      basis: "No owner name was read from the sale deed.",
    },
  ] satisfies SampleClaim[],
  alerts: [
    {
      level: "high",
      tag: "Ownership mismatch",
      title: "Potential inconsistency in owner name",
      explanation:
        "The 7/12 extract records राम पाटील, while the seller states Ram Patil. The two names may refer to the same person, but the records do not establish that.",
      why: "A name difference can mean the seller is not the recorded holder, or that the documents refer to different people.",
      next: "Compare the full names and addresses on the original deed and the current 7/12. Ask the Sub-Registrar for the registered copy.",
      source: "7/12 extract · document dated 15 Jun 2025",
      statement: "The seller is the recorded holder.",
    },
    {
      level: "medium",
      tag: "Loan or mortgage",
      title: "Mortgage claim needs confirmation",
      explanation:
        "The seller says there is no mortgage. No encumbrance certificate was supplied, so the claim cannot be checked from the documents here.",
      why: "An undisclosed charge can affect the transfer and the buyer's position.",
      next: "Ask for an encumbrance certificate and check the registration records.",
      source: "Seller statement",
      statement: "The plot is 2,000 sq ft and has no mortgage.",
    },
  ] satisfies SampleAlert[],
  checklist: [
    {
      group: "Land record and title",
      label: "7/12 extract",
      checked: true,
      authority: "Talathi, Land Records Department",
      note: "Current extract downloaded from Mahabhulekh and uploaded.",
    },
    {
      group: "Land record and title",
      label: "Sale deed for the seller's title",
      checked: true,
      authority: "Sub-Registrar of Assurances",
      note: "Registered copy supplied by the seller.",
    },
    {
      group: "Land record and title",
      label: "Mutation entry after the last transfer",
      checked: false,
      authority: "Talathi, Land Records Department",
      note: "Not supplied. Ask the Talathi for the mutation entry.",
    },
    {
      group: "Land use and survey",
      label: "Survey map of the parcel",
      checked: false,
      authority: "Land Records Department",
      note: "Use the map to compare boundaries with what you see on site.",
    },
    {
      group: "Municipal and building records",
      label: "Property card",
      checked: false,
      authority: "Municipal corporation or council",
      note: "Ask for the municipal record of the property.",
    },
  ] satisfies SampleChecklistItem[],
};
