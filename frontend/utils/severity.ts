import { SeverityInput } from "../types";

export function calculateSeverity(input: SeverityInput) {
  let score = 0;
  if (input.affectedLeaves === "many") score += 1;
  if (input.affectedLeaves === "most") score += 2;
  if (input.spread === "slow") score += 1;
  if (input.spread === "fast") score += 2;
  if (input.fruitOrStem === "yes") score += 2;

  if (score >= 4) {
    return {
      level: "High" as const,
      recommendation: "Act quickly, isolate affected plants if possible, and contact a local agriculture expert before spraying stronger chemicals."
    };
  }
  if (score >= 2) {
    return {
      level: "Medium" as const,
      recommendation: "Remove infected leaves, monitor spread for 2-3 days, and apply recommended treatment carefully."
    };
  }
  return {
    level: "Low" as const,
    recommendation: "Monitor the plant, improve field hygiene, and avoid unnecessary spraying unless symptoms spread."
  };
}
