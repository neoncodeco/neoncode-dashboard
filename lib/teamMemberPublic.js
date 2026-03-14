import getDB from "@/lib/mongodb";
import {
  getDefaultTeamMemberProfile,
  getTeamMemberPublicUrl,
  getTeamMemberQrUrlWithFallback,
  normalizeTeamMemberUsername,
  sanitizeTeamMemberProfile,
} from "@/lib/teamMemberProfile";
import { findTeamMemberByPublicId, findTeamMemberByUsername } from "@/lib/teamMembers";

export async function getPublicTeamMemberByUsername(username) {
  const normalizedUsername = normalizeTeamMemberUsername(username);
  if (!normalizedUsername) return null;

  const { db } = await getDB();
  const teamMemberDoc = await findTeamMemberByUsername(db, normalizedUsername);
  if (!teamMemberDoc) return null;

  const user = await db.collection("users").findOne({ userId: teamMemberDoc.userId });
  if (!user || user.role !== "team_member") return null;

  const profile = sanitizeTeamMemberProfile(
    teamMemberDoc.profile || user.teamMemberProfile || getDefaultTeamMemberProfile(user),
    user
  );

  return {
    username: normalizedUsername,
    publicUrl: getTeamMemberPublicUrl(normalizedUsername),
    qrUrl: getTeamMemberQrUrlWithFallback({
      publicId: teamMemberDoc.publicId,
      username: normalizedUsername,
    }),
    profile,
    user: {
      userId: user.userId,
      name: user.name || "",
      email: user.email || "",
      photo: user.photo || "",
      role: user.role || "team_member",
    },
  };
}

export async function getPublicTeamMemberByPublicId(publicId) {
  const normalizedPublicId = String(publicId || "").trim();
  if (!normalizedPublicId) return null;

  const { db } = await getDB();
  const teamMemberDoc = await findTeamMemberByPublicId(db, normalizedPublicId);
  if (!teamMemberDoc?.username) return null;

  return getPublicTeamMemberByUsername(teamMemberDoc.username);
}

export function createVCard(publicData) {
  const profile = publicData?.profile || {};
  const fullName = profile.displayName || publicData?.user?.name || "Team Member";
  const email = profile.publicEmail || publicData?.user?.email || "";
  const phone = profile.phone || "";
  const website = profile.website || publicData?.publicUrl || "";
  const company = profile.company || "Neon Code";
  const title = profile.headline || "Team Member";
  const address = profile.location || "";

  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${escapeVCard(fullName)}`,
    `N:${escapeVCard(fullName)};;;;`,
    `ORG:${escapeVCard(company)}`,
    `TITLE:${escapeVCard(title)}`,
    email ? `EMAIL;TYPE=INTERNET:${escapeVCard(email)}` : "",
    phone ? `TEL;TYPE=CELL:${escapeVCard(phone)}` : "",
    website ? `URL:${escapeVCard(website)}` : "",
    address ? `ADR:;;;${escapeVCard(address)};;;` : "",
    "END:VCARD",
  ]
    .filter(Boolean)
    .join("\n");
}

function escapeVCard(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}
