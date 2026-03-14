import {
  getDefaultTeamMemberProfile,
  normalizeTeamMemberUsername,
  sanitizeTeamMemberProfile,
} from "@/lib/teamMemberProfile";
import { randomUUID } from "crypto";

const TEAM_MEMBERS_COLLECTION = "team-members";

export function getTeamMembersCollection(db) {
  return db.collection(TEAM_MEMBERS_COLLECTION);
}

export async function findTeamMemberByUserId(db, userId) {
  if (!userId) return null;
  return getTeamMembersCollection(db).findOne({ userId });
}

export async function findTeamMemberByUsername(db, username) {
  const normalizedUsername = normalizeTeamMemberUsername(username);
  if (!normalizedUsername) return null;
  return getTeamMembersCollection(db).findOne({ username: normalizedUsername });
}

export async function findTeamMemberByPublicId(db, publicId) {
  if (!publicId) return null;
  return getTeamMembersCollection(db).findOne({ publicId: String(publicId).trim() });
}

function createTeamMemberPublicId() {
  return randomUUID().replace(/-/g, "");
}

export function buildTeamMemberProfile(user, profileInput) {
  return sanitizeTeamMemberProfile(profileInput, user);
}

export function buildTeamMemberDoc(user, existingDoc, username, profileInput) {
  const normalizedUsername = normalizeTeamMemberUsername(username || existingDoc?.username);
  const profile = buildTeamMemberProfile(user, profileInput || existingDoc?.profile);

  return {
    userId: user.userId,
    publicId: existingDoc?.publicId || createTeamMemberPublicId(),
    email: user.email || "",
    name: user.name || "",
    photo: user.photo || "",
    username: normalizedUsername,
    profile,
    role: user.role || "team_member",
    updatedAt: new Date(),
    createdAt: existingDoc?.createdAt || new Date(),
  };
}

export async function upsertTeamMemberDoc(db, user, username, profileInput) {
  const existingDoc = await findTeamMemberByUserId(db, user.userId);
  const nextDoc = buildTeamMemberDoc(user, existingDoc, username, profileInput);

  await getTeamMembersCollection(db).updateOne(
    { userId: user.userId },
    { $set: nextDoc },
    { upsert: true }
  );

  return nextDoc;
}

export async function deleteTeamMemberDoc(db, userId) {
  if (!userId) return;
  await getTeamMembersCollection(db).deleteOne({ userId });
}

export function getTeamMemberView(user, teamMemberDoc) {
  const legacyProfile =
    user?.teamMemberProfile && typeof user.teamMemberProfile === "object"
      ? user.teamMemberProfile
      : null;
  const baseProfile = teamMemberDoc?.profile || legacyProfile || getDefaultTeamMemberProfile(user);
  return {
    username: teamMemberDoc?.username || user?.teamMemberUsername || "",
    profile: sanitizeTeamMemberProfile(baseProfile, user),
  };
}
