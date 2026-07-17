import { diseaseLibrary } from "../data/diseaseLibrary";
import { PredictionResponse, ProgressStatus } from "../types";
import { cropFromDisease, displayDiseaseName } from "./disease";

type DiseaseMeta = {
  id: string;
  name: string;
  crop: string;
  healthy: boolean;
  category: string;
  summary: string;
};

export type RuleProgressAnalysis = {
  status: ProgressStatus;
  summary: string;
  reasons: string[];
  nextSteps: string[];
  previousMeta?: DiseaseMeta;
  currentMeta?: DiseaseMeta;
};

const LOW_CONFIDENCE_LIMIT = 0.4;
const STABLE_CONFIDENCE_DELTA = 0.12;

export const confidenceDisclaimer = "Confidence score indicates model certainty and does not directly represent disease severity.";

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function isHealthy(label: string) {
  return normalize(label).includes("healthy");
}

function isNonLeaf(label: string) {
  const normalized = normalize(label);
  return normalized.includes("background") || normalized.includes("without leaves") || normalized.includes("without_leaves");
}

export function getDiseaseMeta(label: string) {
  const normalized = normalize(label);
  return diseaseLibrary.find((item) => normalize(item.id) === normalized || normalize(item.name) === normalized);
}

export function analyzeProgress(previous: PredictionResponse, current: PredictionResponse): RuleProgressAnalysis {
  const previousMeta = getDiseaseMeta(previous.disease);
  const currentMeta = getDiseaseMeta(current.disease);
  const previousName = displayDiseaseName(previous.disease);
  const currentName = displayDiseaseName(current.disease);
  const previousCrop = previousMeta?.crop || cropFromDisease(previous.disease);
  const currentCrop = currentMeta?.crop || cropFromDisease(current.disease);
  const sameDisease = normalize(previous.disease) === normalize(current.disease);
  const sameCrop = normalize(previousCrop) === normalize(currentCrop);
  const previousHealthy = previousMeta?.healthy ?? isHealthy(previous.disease);
  const currentHealthy = currentMeta?.healthy ?? isHealthy(current.disease);
  const confidenceDelta = current.confidence - previous.confidence;
  const lowConfidence = previous.confidence < LOW_CONFIDENCE_LIMIT || current.confidence < LOW_CONFIDENCE_LIMIT;
  const reasons: string[] = [];
  let status: ProgressStatus = "Inconclusive";
  let summary = "The two scans do not provide enough consistent evidence to judge progress confidently.";

  const prevPct = previous.affected_area_percentage;
  const currPct = current.affected_area_percentage;
  const hasAreaStats = prevPct !== undefined && currPct !== undefined && previous.leaf_detected !== false && current.leaf_detected !== false;

  if (isNonLeaf(previous.disease) || isNonLeaf(current.disease)) {
    reasons.push("One scan does not contain a clear leaf image.");
    summary = "Progress is inconclusive because one of the scans may not show a clear plant leaf.";
  } else if (lowConfidence) {
    reasons.push("At least one scan has low model certainty.");
    summary = "Progress is inconclusive because one scan has low model confidence. Retake a clear photo before making treatment decisions.";
  } else if (!sameCrop) {
    reasons.push(`The scans appear to belong to different crops: ${previousCrop} and ${currentCrop}.`);
    summary = "Progress is inconclusive because the previous and current scans may not be from the same crop or plant type.";
  } else if (hasAreaStats) {
    const pctDelta = currPct - prevPct;
    reasons.push(`Previous infected leaf area: ${prevPct}%. Current infected leaf area: ${currPct}%.`);
    
    if (!previousHealthy && currentHealthy) {
      status = "Improving";
      reasons.push("The previous scan detected a disease, while the current scan is classified as healthy.");
      summary = `The plant appears to be improving because the latest scan changed from ${previousName} to a healthy class. Confirm this with visible symptoms on the same plant.`;
    } else if (previousHealthy && !currentHealthy) {
      status = "Worsening";
      reasons.push("The previous scan was healthy, while the current scan detected a disease.");
      summary = `The plant may be worsening because the latest scan changed from healthy to ${currentName}. Check whether new symptoms are visible.`;
    } else if (pctDelta <= -2.0) {
      status = "Improving";
      const recoveryRate = prevPct > 0 ? Math.round(((prevPct - currPct) / prevPct) * 100) : 100;
      reasons.push("Calculated disease area percentage decreased significantly.");
      summary = `The leaf condition appears to be improving. The affected area decreased from ${prevPct}% to ${currPct}% (a ${recoveryRate}% recovery). Confirm this with visible symptoms on the plant.`;
    } else if (pctDelta >= 2.0) {
      status = "Worsening";
      const worseningRate = prevPct > 0 ? Math.round(((currPct - prevPct) / prevPct) * 100) : 100;
      reasons.push("Calculated disease area percentage increased significantly.");
      summary = `The leaf condition may be worsening. The affected area increased from ${prevPct}% to ${currPct}% (a ${worseningRate}% increase in infected area). Inspect the plant and nearby leaves.`;
    } else {
      status = "Stable";
      reasons.push("Disease area percentage remained relatively stable.");
      summary = `The condition appears stable. The affected area remains close to previous values (changed from ${prevPct}% to ${currPct}%). Continue regular monitoring and field hygiene.`;
    }
  } else if (!previousHealthy && currentHealthy) {
    status = "Improving";
    reasons.push("The previous scan detected a disease, while the current scan is classified as healthy.");
    summary = `The plant appears to be improving because the latest scan changed from ${previousName} to a healthy class. Confirm this with visible symptoms on the same plant.`;
  } else if (previousHealthy && !currentHealthy) {
    status = "Worsening";
    reasons.push("The previous scan was healthy, while the current scan detected a disease.");
    summary = `The plant may be worsening because the latest scan changed from healthy to ${currentName}. Check whether new symptoms are visible.`;
  } else if (sameDisease) {
    status = Math.abs(confidenceDelta) <= STABLE_CONFIDENCE_DELTA ? "Stable" : "Stable";
    reasons.push(`Both scans detected ${currentName}.`);
    if (Math.abs(confidenceDelta) <= STABLE_CONFIDENCE_DELTA) {
      reasons.push("Model certainty stayed in a similar range.");
      summary = `The condition appears stable because both scans identify ${currentName}. ${confidenceDisclaimer}`;
    } else {
      reasons.push("Model certainty changed, but confidence is not a severity score.");
      summary = `The same disease is still being detected. Treatment progress cannot be confirmed from confidence alone. ${confidenceDisclaimer}`;
    }
  } else {
    status = "Inconclusive";
    reasons.push(`The disease label changed from ${previousName} to ${currentName}.`);
    summary = "The disease label changed between scans, so progress is inconclusive. Retake a clear image and compare with field symptoms before changing treatment.";
  }

  return {
    status,
    summary,
    reasons,
    nextSteps: buildNextSteps(status),
    previousMeta,
    currentMeta
  };
}

function buildNextSteps(status: ProgressStatus) {
  if (status === "Improving") {
    return [
      "Continue the current care routine and monitor for new spots or yellowing.",
      "Scan the same plant again after 2-3 days in similar lighting.",
      "Avoid unnecessary spraying if symptoms are reducing."
    ];
  }
  if (status === "Worsening") {
    return [
      "Inspect nearby leaves and plants for spread.",
      "Remove heavily infected leaves if appropriate for the crop.",
      "Contact a local agriculture expert before using stronger chemicals."
    ];
  }
  if (status === "Stable") {
    return [
      "Keep monitoring the same plant for visible symptom changes.",
      "Follow safe field hygiene and watering practices.",
      "Repeat the scan after 2-3 days to confirm the trend."
    ];
  }
  return [
    "Retake both scans with one clear leaf centered in natural light.",
    "Compare the AI result with visible symptoms on the plant.",
    "Ask an agriculture expert if the disease label keeps changing."
  ];
}
