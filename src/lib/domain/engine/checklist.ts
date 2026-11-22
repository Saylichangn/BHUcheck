import type { DocumentType } from "@/lib/documents/types";
import type {
  ChecklistRequirement,
  ChecklistStatus,
} from "@/lib/domain/checklist";
import { checklistStatusNotes } from "@/lib/domain/checklist";
import type { FraudTag } from "@/lib/domain/tags";
import type { IntendedUse, PropertyType } from "@/lib/investigations/types";

export type ChecklistInvestigation = {
  district: string;
  surveyNo: string | null;
  intendedUse: IntendedUse;
  propertyType: PropertyType;
};

export type ChecklistDocument = {
  id: string;
  type: DocumentType;
  originalName: string;
  uploadedAt: Date;
};

export type ChecklistInput = {
  investigation: ChecklistInvestigation;
  documents: ChecklistDocument[];
};

export type Applicability = "applicable" | "not_applicable" | "unknown";

export type ChecklistRule = {
  key: string;
  label: string;
  authority: string;
  group: string;
  requirement: ChecklistRequirement;
  guidanceOnly: boolean;
  tags: FraudTag[];
  sourceSlug: string | null;
  note: string;
  satisfiedBy: DocumentType[];
  applies: (input: ChecklistInput) => Applicability;
};

export type ChecklistResultItem = {
  key: string;
  label: string;
  authority: string;
  groupLabel: string;
  requirement: ChecklistRequirement;
  guidanceOnly: boolean;
  tags: string[];
  sourceSlug: string | null;
  status: ChecklistStatus;
  satisfiedByDocumentId: string | null;
  note: string;
  sortOrder: number;
};

const always = () => "applicable" as const;
const unknown = () => "unknown" as const;
const isFlat = (input: ChecklistInput) =>
  input.investigation.propertyType === "flat";
const isFarmland = (input: ChecklistInput) =>
  input.investigation.propertyType === "farmland";
const isPlot = (input: ChecklistInput) =>
  input.investigation.propertyType === "plot";

function hasType(input: ChecklistInput, types: DocumentType[]) {
  return input.documents.some((document) => types.includes(document.type));
}

function hasAnyTransfer(input: ChecklistInput) {
  return hasType(input, ["sale_deed", "index_ii", "mutation_entry"]);
}

export const checklistRules: ChecklistRule[] = [
  {
    key: "seven_twelve",
    label: "7/12 extract",
    authority: "Talathi, Land Records Department",
    group: "Land record and title",
    requirement: "always",
    guidanceOnly: false,
    tags: ["document_authenticity", "ownership_mismatch"],
    sourceSlug: "mahabhulekh",
    note: "Download the current extract from Mahabhulekh or get it from the Talathi. Check the survey number, the holder's name and the other-rights column.",
    satisfiedBy: ["7_12"],
    applies: (input) => (isFlat(input) ? "not_applicable" : "applicable"),
  },
  {
    key: "eight_a",
    label: "8A record",
    authority: "Talathi, Land Records Department",
    group: "Land record and title",
    requirement: "depends",
    guidanceOnly: false,
    tags: ["document_authenticity"],
    sourceSlug: "mahabhulekh",
    note: "8A records the holder and crop entries for agricultural land. Ask for it together with the 7/12.",
    satisfiedBy: ["8a"],
    applies: (input) =>
      isFarmland(input) ||
      (!isFlat(input) &&
        (input.investigation.intendedUse === "agricultural" ||
          hasType(input, ["7_12", "8a"])))
        ? "applicable"
        : "not_applicable",
  },
  {
    key: "sale_deed",
    label: "Sale deed for the seller's title",
    authority: "Sub-Registrar of Assurances",
    group: "Land record and title",
    requirement: "always",
    guidanceOnly: false,
    tags: ["ownership_mismatch", "document_authenticity"],
    sourceSlug: "igr-maharashtra",
    note: "Ask for the registered copy of the deed by which the seller acquired the property. Check the survey number, area, names and date.",
    satisfiedBy: ["sale_deed"],
    applies: always,
  },
  {
    key: "index_ii",
    label: "Index II for the last registered transfer",
    authority: "Sub-Registrar of Assurances",
    group: "Land record and title",
    requirement: "depends",
    guidanceOnly: false,
    tags: ["fake_registration"],
    sourceSlug: "igr-maharashtra",
    note: "Index II is the registration-office extract of a registered document. Compare the parties, date, area and consideration with the deed.",
    satisfiedBy: ["index_ii"],
    applies: (input) =>
      hasAnyTransfer(input) ? "applicable" : "not_applicable",
  },
  {
    key: "mutation_entry",
    label: "Mutation entry after the last transfer",
    authority: "Talathi, Land Records Department",
    group: "Land record and title",
    requirement: "depends",
    guidanceOnly: false,
    tags: ["mutation_not_updated"],
    sourceSlug: "mahabhulekh",
    note: "Mutation entries show changes to the land record after a transfer or inheritance. Check them against the sale deed and the 7/12.",
    satisfiedBy: ["mutation_entry"],
    applies: (input) =>
      hasAnyTransfer(input) ? "applicable" : "not_applicable",
  },
  {
    key: "encumbrance_or_search",
    label: "Encumbrance certificate or title search report",
    authority: "Sub-Registrar of Assurances or an advocate",
    group: "Land record and title",
    requirement: "always",
    guidanceOnly: false,
    tags: ["hidden_mortgage", "court_case", "double_sale"],
    sourceSlug: "igr-maharashtra",
    note: "Ask the Sub-Registrar for an encumbrance certificate, or have an advocate prepare a title search report covering the relevant years.",
    satisfiedBy: ["encumbrance_certificate", "search_report"],
    applies: always,
  },
  {
    key: "heirship",
    label: "Heirship or succession document",
    authority: "Revenue authority or court",
    group: "Land record and title",
    requirement: "depends",
    guidanceOnly: false,
    tags: ["succession_heirs"],
    sourceSlug: null,
    note: "Applies if the property passed by inheritance or the seller's title depends on a succession document.",
    satisfiedBy: ["heirship_certificate"],
    applies: unknown,
  },
  {
    key: "na_order",
    label: "Non-agricultural (NA) order",
    authority: "District Collector or planning authority",
    group: "Land use and survey",
    requirement: "depends",
    guidanceOnly: false,
    tags: ["agricultural_land_without_na"],
    sourceSlug: null,
    note: "An NA order is needed when agricultural land is used for a non-agricultural purpose. It should cover the same survey number and area.",
    satisfiedBy: ["na_order"],
    applies: (input) =>
      input.investigation.intendedUse === "agricultural"
        ? "not_applicable"
        : "unknown",
  },
  {
    key: "survey_map",
    label: "Survey map of the parcel",
    authority: "Land Records Department",
    group: "Land use and survey",
    requirement: "depends",
    guidanceOnly: false,
    tags: ["encroachment_boundary"],
    sourceSlug: "mahabhunakasha",
    note: "Use the map to compare the parcel shape and boundaries with what you see on site.",
    satisfiedBy: ["survey_map"],
    applies: (input) =>
      isFlat(input)
        ? "not_applicable"
        : input.investigation.surveyNo?.trim()
          ? "applicable"
          : "unknown",
  },
  {
    key: "zoning_certificate",
    label: "Zoning or reservation certificate",
    authority: "Municipal corporation or planning authority",
    group: "Land use and survey",
    requirement: "depends",
    guidanceOnly: false,
    tags: ["zoning_reservation"],
    sourceSlug: null,
    note: "Applies in municipal or planning-authority areas. It shows the zone and any reservation on the land.",
    satisfiedBy: ["zoning_certificate"],
    applies: unknown,
  },
  {
    key: "property_card",
    label: "Property card",
    authority: "Municipal corporation or council",
    group: "Municipal and building records",
    requirement: "depends",
    guidanceOnly: false,
    tags: ["ownership_mismatch"],
    sourceSlug: null,
    note: "Applies to properties in municipal records. It shows the recorded holder and the property details.",
    satisfiedBy: ["property_card"],
    applies: (input) => (isFarmland(input) ? "not_applicable" : "applicable"),
  },
  {
    key: "tax_receipt",
    label: "Latest property tax receipt",
    authority: "Municipal corporation or council",
    group: "Municipal and building records",
    requirement: "depends",
    guidanceOnly: false,
    tags: ["document_authenticity"],
    sourceSlug: null,
    note: "Ask for the latest receipt and check the property description and the name on it.",
    satisfiedBy: ["tax_receipt"],
    applies: (input) => (isFarmland(input) ? "not_applicable" : "applicable"),
  },
  {
    key: "layout_approval",
    label: "Layout approval",
    authority: "Planning authority",
    group: "Municipal and building records",
    requirement: "depends",
    guidanceOnly: false,
    tags: ["unauthorized_layout"],
    sourceSlug: null,
    note: "Applies to plotted developments. Check that the layout is approved and that the plot number and area match.",
    satisfiedBy: ["layout_approval"],
    applies: (input) => (isPlot(input) ? "applicable" : "not_applicable"),
  },
  {
    key: "building_permission",
    label: "Building permission",
    authority: "Planning authority",
    group: "Municipal and building records",
    requirement: "depends",
    guidanceOnly: false,
    tags: ["unauthorized_construction"],
    sourceSlug: null,
    note: "Applies where a building exists or is proposed. Check that the permission matches the building on site.",
    satisfiedBy: ["building_permission"],
    applies: (input) => (isFarmland(input) ? "not_applicable" : "applicable"),
  },
  {
    key: "occupancy_certificate",
    label: "Occupancy certificate",
    authority: "Planning authority",
    group: "Municipal and building records",
    requirement: "depends",
    guidanceOnly: false,
    tags: ["unauthorized_construction"],
    sourceSlug: null,
    note: "Applies to completed buildings. It shows that the local authority accepted the construction.",
    satisfiedBy: ["occupancy_certificate"],
    applies: (input) =>
      isFlat(input)
        ? "applicable"
        : isFarmland(input)
          ? "not_applicable"
          : "unknown",
  },
  {
    key: "society_documents",
    label: "Society documents",
    authority: "Co-operative housing society",
    group: "Municipal and building records",
    requirement: "depends",
    guidanceOnly: false,
    tags: ["ownership_mismatch"],
    sourceSlug: null,
    note: "Applies to flats in a registered society. Ask for the share certificate, society registration and latest maintenance receipts.",
    satisfiedBy: ["society_documents"],
    applies: (input) => (isFlat(input) ? "applicable" : "not_applicable"),
  },
  {
    key: "rera_registration",
    label: "MahaRERA registration",
    authority: "MahaRERA",
    group: "Municipal and building records",
    requirement: "depends",
    guidanceOnly: false,
    tags: ["rera_registration"],
    sourceSlug: "maharera",
    note: "Applies to projects registered with MahaRERA. Check the project and promoter registration on the portal.",
    satisfiedBy: ["rera_registration"],
    applies: (input) => (isFlat(input) ? "applicable" : "not_applicable"),
  },
  {
    key: "litigation_search",
    label: "Litigation search",
    authority: "eCourts or the civil court",
    group: "Disputes and registries",
    requirement: "always",
    guidanceOnly: false,
    tags: ["court_case"],
    sourceSlug: "ecourts",
    note: "Ask an advocate for a search of civil cases involving the seller and the property, or search eCourts yourself and upload the result.",
    satisfiedBy: ["litigation_search"],
    applies: always,
  },
  {
    key: "ecourts_check",
    label: "Search eCourts for the seller and the property",
    authority: "eCourts",
    group: "Disputes and registries",
    requirement: "always",
    guidanceOnly: true,
    tags: ["court_case"],
    sourceSlug: "ecourts",
    note: "Search by party name and by the property details. Keep any result you obtain with the other papers.",
    satisfiedBy: [],
    applies: always,
  },
  {
    key: "cersai_check",
    label: "Search CERSAI for a registered security interest",
    authority: "CERSAI",
    group: "Disputes and registries",
    requirement: "always",
    guidanceOnly: true,
    tags: ["hidden_mortgage"],
    sourceSlug: "cersai",
    note: "CERSAI records security interests. Search the registry and keep the result with the other papers.",
    satisfiedBy: [],
    applies: always,
  },
  {
    key: "site_visit",
    label: "Physical site and boundary check",
    authority: "Yourself or a surveyor",
    group: "Identity and transaction steps",
    requirement: "always",
    guidanceOnly: true,
    tags: ["encroachment_boundary", "unauthorized_construction"],
    sourceSlug: null,
    note: "Visit the property, compare the physical boundaries with the survey map, and ask who is in possession.",
    satisfiedBy: [],
    applies: always,
  },
  {
    key: "seller_identity",
    label: "Seller identity check",
    authority: "Yourself",
    group: "Identity and transaction steps",
    requirement: "always",
    guidanceOnly: true,
    tags: ["ownership_mismatch", "document_authenticity"],
    sourceSlug: null,
    note: "Compare the seller's identity documents with the name on the 7/12, the sale deed and the tax records. Do this before paying any token amount.",
    satisfiedBy: [],
    applies: always,
  },
  {
    key: "power_of_attorney",
    label: "Registered power of attorney",
    authority: "Sub-Registrar of Assurances",
    group: "Identity and transaction steps",
    requirement: "depends",
    guidanceOnly: false,
    tags: ["poa_misuse"],
    sourceSlug: null,
    note: "Applies when the seller acts through an agent. Ask for the registered power of attorney and check its scope and validity.",
    satisfiedBy: ["power_of_attorney"],
    applies: unknown,
  },
  {
    key: "stamp_duty_check",
    label: "Stamp duty and ready reckoner check",
    authority: "Registration office or an advocate",
    group: "Identity and transaction steps",
    requirement: "always",
    guidanceOnly: true,
    tags: ["stamp_duty_valuation"],
    sourceSlug: "igr-maharashtra",
    note: "Check the ready reckoner rate and the stamp duty with the registration office or an advocate before agreeing a price.",
    satisfiedBy: [],
    applies: always,
  },
];

function noteFor(
  rule: ChecklistRule,
  status: ChecklistStatus,
  fileName: string | null,
) {
  if (status === "satisfied" && fileName) {
    return `${rule.note} Uploaded copy: ${fileName}.`;
  }

  if (rule.guidanceOnly) {
    return `${rule.note} This step is done outside BHUcheck and is not tracked automatically.`;
  }

  return `${rule.note} ${checklistStatusNotes[status]}`;
}

export function buildChecklist(input: ChecklistInput): ChecklistResultItem[] {
  const documents = [...input.documents].sort(
    (left, right) => right.uploadedAt.getTime() - left.uploadedAt.getTime(),
  );

  return checklistRules.map((rule, index) => {
    const match = documents.find((document) =>
      rule.satisfiedBy.includes(document.type),
    );
    const applicability = rule.applies(input);

    let status: ChecklistStatus;

    if (match) {
      status = "satisfied";
    } else if (rule.guidanceOnly) {
      status = "unconfirmed";
    } else if (applicability === "not_applicable") {
      status = "not_applicable";
    } else if (applicability === "unknown") {
      status = "unconfirmed";
    } else {
      status = rule.requirement === "always" ? "missing" : "obtain";
    }

    return {
      key: rule.key,
      label: rule.label,
      authority: rule.authority,
      groupLabel: rule.group,
      requirement: rule.requirement,
      guidanceOnly: rule.guidanceOnly,
      tags: rule.tags,
      sourceSlug: rule.sourceSlug,
      status,
      satisfiedByDocumentId: match?.id ?? null,
      note: noteFor(rule, status, match?.originalName ?? null),
      sortOrder: index,
    };
  });
}
