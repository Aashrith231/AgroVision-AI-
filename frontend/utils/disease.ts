export function diseaseToSlug(disease: string) {
  return encodeURIComponent(disease);
}

export function slugToDisease(slug: string | string[] | undefined) {
  if (!slug) return "";
  const value = Array.isArray(slug) ? slug[0] : slug;
  return decodeURIComponent(value);
}

export function displayDiseaseName(disease: string) {
  return disease
    .replace(/___/g, " - ")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function cropFromDisease(disease: string) {
  return displayDiseaseName(disease).split(" - ")[0] || "Plant";
}
