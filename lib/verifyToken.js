import { adminAuth } from "./firebaseAdmin";

export async function verifyToken(req) {
  try {
    const auth = req.headers.get("authorization");

    if (!auth) return null;

    const token = auth.split(" ")[1];
    if (!token) return null;

    const decoded = await adminAuth.verifyIdToken(token);
    return decoded;
  } catch (err) {
    return null;
  }
}
