"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { applyBrandVars, BRAND_DOC, DEFAULT_BRAND, mergeBrand } from "@/lib/brand";

const BrandContext = createContext(null);
const DARK_KEY = "hub-dark-mode";

export function BrandProvider({ children }) {
  const [brand, setBrand] = useState(DEFAULT_BRAND);
  const [dark, setDarkState] = useState(false);

  useEffect(() => {
    setDarkState(window.localStorage.getItem(DARK_KEY) === "1");
  }, []);

  useEffect(() => {
    const ref = doc(db, BRAND_DOC.collection, BRAND_DOC.id);
    return onSnapshot(
      ref,
      (snap) => setBrand(mergeBrand(snap.data())),
      () => setBrand(DEFAULT_BRAND)
    );
  }, []);

  useEffect(() => {
    applyBrandVars(brand, dark);
  }, [brand, dark]);

  const setDark = (value) => {
    setDarkState(value);
    window.localStorage.setItem(DARK_KEY, value ? "1" : "0");
  };

  const value = useMemo(() => ({ brand, dark, setDark }), [brand, dark]);
  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

export function useBrand() {
  const ctx = useContext(BrandContext);
  if (!ctx) return { brand: DEFAULT_BRAND, dark: false, setDark: () => {} };
  return ctx;
}
