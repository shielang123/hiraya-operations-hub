"use client";

import { useData } from "@/components/DataProvider";

// Kept for compatibility with Phase 1 pages: live bookings plus a room lookup.
export function useBookings() {
  const { bookings, rooms, loading, errors } = useData();
  const error = errors.find(([n]) => n === "bookings")?.[1] || "";
  return {
    bookings: bookings.filter((b) => ["approved", "confirmed", "paid", "checked-in"].includes(b.status)),
    rooms,
    loading,
    error,
  };
}
