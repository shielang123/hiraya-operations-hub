// One bill formula for the whole resort (matches computeBill() in the integration guide).
// Move this file to packages/shared so the Hub, Bar Counter and any future app use the same maths.
export function computeBill(booking, charges = [], payments = []) {
  const live = charges.filter((c) => !c.voided);
  const extras = live.reduce((s, c) => s + c.amount, 0);
  const extrasByCategory = {};
  live.forEach((c) => {
    extrasByCategory[c.category] = (extrasByCategory[c.category] || 0) + c.amount;
  });
  const room = booking?.totalCentavos || 0;
  const onlinePaid = booking?.onlinePaid || 0;
  const hubPaid = payments.reduce((s, p) => s + p.amount, 0);
  const paid = onlinePaid + hubPaid;
  return {
    room,
    extras,
    extrasByCategory,
    onlinePaid,
    hubPaid,
    paid,
    total: room + extras,
    balance: room + extras - paid,
    charges,
    payments,
  };
}
