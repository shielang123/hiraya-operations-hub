// All money is stored as whole centavos (15050 = PHP 150.50) in every collection.
export function toCentavos(input) {
  const n = parseFloat(String(input ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

export function formatPHP(centavos) {
  const n = Number(centavos) || 0;
  return (
    (n < 0 ? "-" : "") +
    "₱" +
    (Math.abs(n) / 100).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );
}

export function formatPHPShort(centavos) {
  const n = (Number(centavos) || 0) / 100;
  if (Math.abs(n) >= 1000000) return "₱" + (n / 1000000).toFixed(1) + "M";
  if (Math.abs(n) >= 1000) return "₱" + (n / 1000).toFixed(1) + "k";
  return "₱" + n.toFixed(0);
}
