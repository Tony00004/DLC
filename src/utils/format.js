export function getSchoolYear(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const y = d.getFullYear();
  const m = d.getMonth() + 1; // 1-based
  return m >= 7 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

export function getPrixTotal(r) {
  if (r.type === "requisition") return "N/A";
  if (r.formData && r.formData.total) return r.formData.total;
  if (r.formData && r.formData["Total estimé"]) return r.formData["Total estimé"];
  if (r.formData && r.formData._totalNum) return parseFloat(r.formData._totalNum).toFixed(2) + " $";
  return "—";
}
