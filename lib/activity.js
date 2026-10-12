import { collection, doc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { COLLECTIONS } from "./config";

// Every change that crosses apps writes one line here. Other apps (and the owner feed) read it.
// Add it to the same batch as the change so the two can never get out of step.
export function addActivity(batch, { action, refId, staff, detail = "" }) {
  batch.set(doc(collection(db, COLLECTIONS.activityLog)), {
    app: "hub",
    action,
    refId: refId || "",
    staffId: staff?.id || "",
    staffName: staff?.name || "",
    detail,
    createdAt: serverTimestamp(),
  });
}
