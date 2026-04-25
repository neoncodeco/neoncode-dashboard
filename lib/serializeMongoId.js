/**
 * Coerce Mongo-style ids from API/JSON into a single hex string for React keys, edit maps, and ObjectId().
 */
export function serializeMongoId(id) {
  if (id == null || id === "") return "";
  if (typeof id === "string") return id.trim();
  if (typeof id === "object" && id !== null && "$oid" in id && id.$oid != null) {
    return String(id.$oid).trim();
  }
  if (typeof id === "object" && id !== null && typeof id.toHexString === "function") {
    try {
      return id.toHexString();
    } catch {
      /* ignore */
    }
  }
  return String(id).trim();
}
