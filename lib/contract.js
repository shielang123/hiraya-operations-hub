// The shared data contract, as data. The Integrations page shows it; the other apps can import it
// (or you can move it to packages/shared) so everyone reads the same table.
export const CONTRACT = [
  { collection: "bookings", owner: "Room Booking", hub: "Updates status, checkedIn/Out fields, staffNote", fields: "guestName, roomId, checkIn, checkOut, status, totalAmount" },
  { collection: "rooms", owner: "Room Booking", hub: "Updates cleaningStatus (admin tool, check-out)", fields: "name, type, price, cleaningStatus" },
  { collection: "staff", owner: "Operations Hub", hub: "Creates and edits (admin)", fields: "name, role, active" },
  { collection: "menuItems", owner: "Bar Counter", hub: "Reads", fields: "name, category, price, available" },
  { collection: "orders", owner: "Bar Counter", hub: "Reads", fields: "items, total, paymentMode, bookingId, roomId, status" },
  { collection: "charges", owner: "Operations Hub", hub: "Creates, voids. Bar Counter creates room charges", fields: "bookingId, source, description, amount, voided" },
  { collection: "payments", owner: "Operations Hub", hub: "Creates (cash, GCash, card, bank)", fields: "bookingId, amount, method, reference" },
  { collection: "housekeepingTasks", owner: "Housekeeping", hub: "Creates one on check-out; reads", fields: "roomId, type, status, assignedTo, createdAt" },
  { collection: "activityLog", owner: "Any app appends", hub: "Appends and reads", fields: "app, action, refId, staffId, createdAt" },
];
