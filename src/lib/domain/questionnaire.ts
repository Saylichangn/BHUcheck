export type QuestionnaireQuestion = {
  key: string;
  number: number;
  text: string;
  action: string;
};

export const questionnaireQuestions: QuestionnaireQuestion[] = [
  {
    key: "seller_name_matches_owner",
    number: 1,
    text: "Has the seller's name been matched with the owner's name on the land records?",
    action: "Ask for updated land records and compare the names.",
  },
  {
    key: "all_owners_agree",
    number: 2,
    text: "Have all the owners agreed to sell the land?",
    action: "Ask for details of everyone who owns a share of the land.",
  },
  {
    key: "seller_authority",
    number: 3,
    text: "Has the seller's identity and legal authority been verified?",
    action:
      "If someone is selling on the owner's behalf, ask for valid written permission.",
  },
  {
    key: "seller_acquisition",
    number: 4,
    text: "Has the seller's ownership history been checked?",
    action: "Ask for proof of how the seller became the owner.",
  },
  {
    key: "older_documents",
    number: 5,
    text: "Have the previous land documents been reviewed?",
    action: "Ask for copies of previous sale deeds or inheritance documents.",
  },
  {
    key: "previous_sale_or_agreement",
    number: 6,
    text: "Have previous sales or agreements involving this land been checked?",
    action:
      "Check with the registration office for previous sale agreements and registrations.",
  },
  {
    key: "loan_or_mortgage",
    number: 7,
    text: "Have loans or mortgages on this land been checked?",
    action: "Check the land records, registration records and CERSAI.",
  },
  {
    key: "court_case",
    number: 8,
    text: "Have court cases or disputes involving this land been checked?",
    action: "Check court records and ask the local revenue office.",
  },
  {
    key: "other_occupants",
    number: 9,
    text: "Has the land been checked for other people living on, farming or using it?",
    action: "Visit the land and ask nearby residents about it.",
  },
  {
    key: "permitted_use",
    number: 10,
    text: "Have the permitted uses of this land been verified?",
    action: "Check the permitted land use with the local authority.",
  },
  {
    key: "road_access",
    number: 11,
    text: "Has the legal road access to this land been verified?",
    action: "Check the official land map and road access documents.",
  },
  {
    key: "official_measurement",
    number: 12,
    text: "Have the land's size and boundaries been officially measured?",
    action: "Arrange an official land measurement.",
  },
  {
    key: "acquisition_plans",
    number: 13,
    text: "Have government plans to acquire this land been checked?",
    action: "Check with the local development and government authorities.",
  },
  {
    key: "transfer_restrictions",
    number: 14,
    text: "Have restrictions on selling this land been checked?",
    action:
      "Ask a property lawyer to check whether any special permissions are needed.",
  },
  {
    key: "flood_risk",
    number: 15,
    text: "Has the land been checked for flooding or waterlogging risks?",
    action: "Visit during or after rainfall and ask nearby residents.",
  },
  {
    key: "infrastructure_projects",
    number: 16,
    text: "Have government development plans affecting this land been checked?",
    action: "Check the local development plan and government notices.",
  },
  {
    key: "unpaid_dues",
    number: 17,
    text: "Have unpaid taxes or bills on this land been checked?",
    action: "Ask for the latest tax receipts and payment records.",
  },
  {
    key: "inherited_land_rights",
    number: 18,
    text: "Have the inheritance documents and legal heirs been verified?",
    action:
      "Ask for inheritance documents and confirmation of all legal owners.",
  },
  {
    key: "original_documents",
    number: 19,
    text: "Have the original land documents been inspected?",
    action: "Ask to see the original documents, not just photocopies.",
  },
  {
    key: "payment_to_owner",
    number: 20,
    text: "Has the seller's bank account and payment authority been verified?",
    action: "Verify the person's identity and bank account details.",
  },
  {
    key: "lawyer_review",
    number: 21,
    text: "Have all the land documents been checked by a property lawyer?",
    action:
      "Get an independent lawyer to review everything before paying a token amount.",
  },
  {
    key: "proximity_infrastructure",
    number: 22,
    text: "Has the land’s proximity to major roads, railways and upcoming infrastructure projects been checked?",
    action:
      "Look at the location on a map and visit the site. For planned projects, ask the local planning authority or municipal office. Do not rely on the seller’s or agent’s word that a road or station is coming, because promised projects are often used to push up prices.",
  },
  {
    key: "basic_facilities",
    number: 23,
    text: "Have the availability of basic facilities such as water and electricity been verified?",
    action:
      "Ask the local electricity company whether a connection is possible and what it costs. Ask the local water authority or panchayat about water supply, and ask neighbours how they get water. Note that a connection nearby does not mean you have a right to one.",
  },
  {
    key: "construction_suitability",
    number: 24,
    text: "Has the land’s suitability for construction been confirmed?",
    action:
      "Ask the local planning authority or revenue office whether your planned use is allowed on this land. Farm land usually needs permission before building. A seller saying “you can build here” is not proof. A civil engineer can also check whether the land is practical to build on.",
  },
  {
    key: "soil_testing",
    number: 25,
    text: "Has the soil condition been tested for the intended use?",
    action:
      "Hire a civil engineer or a soil testing lab to test it. For building, this is usually a soil investigation. For farming, a soil health test is available through agriculture offices or private labs. Ask for the report in writing.",
  },
  {
    key: "area_flood_risk",
    number: 26,
    text: "Has the area’s flood risk been checked?",
    action:
      "Ask neighbours and the local municipal or disaster management office whether the area has flooded before. Look at how the land sits compared with nearby water and drains, and visit after heavy rain if you can. Official flood maps may exist for your area, so ask the planning or water resources office.",
  },
  {
    key: "nearby_legal_access",
    number: 27,
    text: "Have nearby properties been checked for major legal or access problems?",
    action:
      "Ask neighbours about disputes, boundary problems or blocked access. Check whether the road or path to your land passes through someone else’s property. A lawyer can check for disputes in the court records.",
  },
  {
    key: "physical_inspection",
    number: 28,
    text: "Has the land been physically inspected before making any payment?",
    action:
      "Visit the land yourself, ideally more than once and at different times. Check who is using it, where the boundaries are, and whether it matches the papers. Do not pay a token amount before the visit.",
  },
  {
    key: "price_comparison",
    number: 29,
    text: "Has the land’s price been compared with at least three similar nearby properties?",
    action:
      "Ask local brokers, neighbours and recent buyers for prices of similar land. Compare the price per unit of area, using the same unit. A price far below nearby land is a warning sign. A price far above it needs an explanation.",
  },
  {
    key: "revenue_tax_dues",
    number: 30,
    text: "Are land revenue and property tax dues paid up?",
    action:
      "Ask the seller for the latest tax receipts and check with the local revenue or municipal office. Unpaid dues can become the buyer’s problem, so ask for a written statement of dues from the office.",
  },
  {
    key: "buyer_eligibility",
    number: 31,
    text: "Is this kind of land allowed to be sold to someone like me?",
    action:
      "Some states limit who can buy farm land, and some tribal or granted land cannot be sold freely. Ask the local revenue office and a property lawyer before you pay anything.",
  },
];

export const questionnaireStatusValues = [
  "no_problem",
  "problem",
  "unsure",
] as const;
export type QuestionnaireStatus = (typeof questionnaireStatusValues)[number];

export type QuestionnaireAnswer = {
  status: QuestionnaireStatus;
  note: string;
};

export const questionnaireStatusLabels: Record<QuestionnaireStatus, string> = {
  no_problem: "No problem found",
  problem: "Problem found",
  unsure: "Not sure",
};

export function isQuestionnaireQuestionKey(value: string) {
  return questionnaireQuestions.some((question) => question.key === value);
}

export function isQuestionnaireStatus(
  value: string,
): value is QuestionnaireStatus {
  return (questionnaireStatusValues as readonly string[]).includes(value);
}
