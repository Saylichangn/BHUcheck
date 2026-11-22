export type GovernmentSource = {
  slug: string;
  name: string;
  department: string;
  whatItMayHold: string;
  url: string;
  automaticAccess: false;
  userAction: string;
  knownLimits: string;
  sortOrder: number;
};

export const governmentSources: GovernmentSource[] = [
  {
    slug: "mahabhumi",
    name: "MahaBhumi",
    department: "Revenue Department, Government of Maharashtra",
    whatItMayHold:
      "Entry point for state land-record services and related portals.",
    url: "https://mahabhumi.gov.in/",
    automaticAccess: false,
    userAction:
      "Open the portal, choose the district and service, then download the record and upload it here.",
    knownLimits:
      "BHUcheck does not access this portal. Services and login requirements vary. Confirm on the portal.",
    sortOrder: 1,
  },
  {
    slug: "mahabhulekh",
    name: "Mahabhulekh",
    department: "Land Records Department, Maharashtra",
    whatItMayHold:
      "Land record extracts, including 7/12 and 8A records, for Maharashtra.",
    url: "https://bhulekh.mahabhumi.gov.in/",
    automaticAccess: false,
    userAction:
      "Select the district, taluka and village, search by survey number, then download the extract and upload it here.",
    knownLimits:
      "Access and download options vary by district. Confirm on the portal.",
    sortOrder: 2,
  },
  {
    slug: "mahabhunakasha",
    name: "Mahabhunakasha",
    department: "Land Records Department, Maharashtra",
    whatItMayHold:
      "Land parcel maps and spatial views linked to land records.",
    url: "https://mahabhunakasha.mahabhumi.gov.in/27/index.html",
    automaticAccess: false,
    userAction:
      "Open the map, select the district and village, locate the parcel, then save the map or screenshot and upload it here.",
    knownLimits:
      "Map layers and coverage vary. Confirm on the portal.",
    sortOrder: 3,
  },
  {
    slug: "land-records",
    name: "Land Records",
    department: "Land Records Department, Maharashtra",
    whatItMayHold:
      "Land records information and related departmental services.",
    url: "https://bhumiabhilekh.maharashtra.gov.in/",
    automaticAccess: false,
    userAction:
      "Open the portal, choose the relevant service, download the available record, and upload it here.",
    knownLimits:
      "BHUcheck does not access this portal. Available services vary. Confirm on the portal.",
    sortOrder: 4,
  },
  {
    slug: "igr-maharashtra",
    name: "IGR Maharashtra",
    department: "Inspector General of Registration, Maharashtra",
    whatItMayHold:
      "Registration offices, registered document services and Index II records.",
    url: "https://igrmaharashtra.gov.in/",
    automaticAccess: false,
    userAction:
      "Use the registration office search, request the Index II or registered document, then upload the copy here.",
    knownLimits:
      "Search and copy procedures vary by office. Confirm on the portal.",
    sortOrder: 5,
  },
  {
    slug: "maharera",
    name: "MahaRERA",
    department: "Maharashtra Real Estate Regulatory Authority",
    whatItMayHold:
      "Real estate project registration and registered agent records.",
    url: "https://maharera.maharashtra.gov.in/",
    automaticAccess: false,
    userAction:
      "Search for the project or agent, download the registration details, then upload them here.",
    knownLimits:
      "Project records cover registered projects only. Confirm on the portal.",
    sortOrder: 6,
  },
  {
    slug: "ecourts",
    name: "eCourts",
    department: "eCommittee, Supreme Court of India",
    whatItMayHold:
      "Case status and orders for courts participating in the eCourts system.",
    url: "https://services.ecourts.gov.in/",
    automaticAccess: false,
    userAction:
      "Search by party name, case number or court, then download the case status or order and upload it here.",
    knownLimits:
      "Not every court or order may be listed. Confirm on the portal.",
    sortOrder: 7,
  },
  {
    slug: "cersai",
    name: "CERSAI",
    department:
      "Central Registry of Securitisation Asset Reconstruction and Security Interest of India",
    whatItMayHold:
      "Security interest and mortgage registrations.",
    url: "https://www.cersai.org.in/",
    automaticAccess: false,
    userAction:
      "Use the available search service, obtain the result, then upload it here.",
    knownLimits:
      "Search access and fees vary. BHUcheck does not query this registry. Confirm on the portal.",
    sortOrder: 8,
  },
  {
    slug: "pune-division-gis",
    name: "Pune Division GIS",
    department: "Pune Division, Government of Maharashtra",
    whatItMayHold:
      "Divisional GIS-based activities and maps.",
    url: "https://divcompune.maharashtra.gov.in/pune-division-gis-based-activities/",
    automaticAccess: false,
    userAction:
      "Open the GIS page, select the available layer or area, save the relevant map, and upload it here.",
    knownLimits:
      "Coverage and layers vary. Confirm on the portal.",
    sortOrder: 9,
  },
];
