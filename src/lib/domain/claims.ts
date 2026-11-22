export const claimStatusValues = [
  "supported",
  "contradicted",
  "unverified",
] as const;

export type ClaimStatus = (typeof claimStatusValues)[number];

export const claimStatusLabels: Record<ClaimStatus, string> = {
  supported: "Supported",
  contradicted: "Contradicted",
  unverified: "Unverified",
};
