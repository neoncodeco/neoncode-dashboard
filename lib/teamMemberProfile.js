const TEAM_MEMBER_BASE_URL = "https://neoncode.co";

export function normalizeTeamMemberUsername(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "");
}

function toString(value, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function parseList(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .slice(0, 20);
  }

  return String(value || "")
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function parseTimeline(value) {
  const lines = Array.isArray(value) ? value : String(value || "").split(/\r?\n/);

  return lines
    .map((line) => String(line || "").trim())
    .filter(Boolean)
    .slice(0, 12)
    .map((line) => {
      const [title = "", company = "", duration = "", description = ""] = line.split("|");

      return {
        title: title.trim(),
        company: company.trim(),
        duration: duration.trim(),
        description: description.trim(),
      };
    })
    .filter((item) => item.title || item.company || item.duration || item.description);
}

function sanitizeSocialLinks(value) {
  const source = value && typeof value === "object" ? value : {};

  return {
    website: toString(source.website),
    github: toString(source.github),
    twitter: toString(source.twitter),
    youtube: toString(source.youtube),
    dribbble: toString(source.dribbble),
    behance: toString(source.behance),
    pinterest: toString(source.pinterest),
    whatsapp: toString(source.whatsapp),
    linkedin: toString(source.linkedin),
    telegram: toString(source.telegram),
    instagram: toString(source.instagram),
    facebook: toString(source.facebook),
  };
}

export function getDefaultTeamMemberProfile(user = {}) {
  return {
    displayName: user.name || "Team Member",
    headline: "",
    company: "Neon Code",
    phone: "",
    publicEmail: user.email || "",
    location: "",
    website: "",
    department: "",
    employeeCode: "",
    about: "",
    avatar: user.photo || "",
    socialLinks: sanitizeSocialLinks(),
    skills: [],
    experience: [],
    projects: [],
  };
}

export function sanitizeTeamMemberProfile(input, user = {}) {
  const fallback = getDefaultTeamMemberProfile(user);
  const source = input && typeof input === "object" ? input : {};

  return {
    displayName: toString(source.displayName, fallback.displayName) || fallback.displayName,
    headline: toString(source.headline, fallback.headline),
    company: toString(source.company, fallback.company) || fallback.company,
    phone: toString(source.phone, fallback.phone),
    publicEmail: toString(source.publicEmail, fallback.publicEmail) || fallback.publicEmail,
    location: toString(source.location, fallback.location),
    website: toString(source.website, fallback.website),
    department: toString(source.department, fallback.department),
    employeeCode: toString(source.employeeCode, fallback.employeeCode),
    about: toString(source.about, fallback.about),
    avatar: toString(source.avatar, fallback.avatar) || fallback.avatar,
    socialLinks: sanitizeSocialLinks(source.socialLinks),
    skills: parseList(source.skills),
    experience: parseTimeline(source.experience),
    projects: parseTimeline(source.projects),
  };
}

export function getTeamMemberPublicUrl(username) {
  const normalized = normalizeTeamMemberUsername(username);
  return normalized ? `${TEAM_MEMBER_BASE_URL}/teammember/${normalized}` : "";
}

export function getTeamMemberCardUrl(publicId) {
  const normalized = toString(publicId);
  return normalized ? `${TEAM_MEMBER_BASE_URL}/teammember/card/${normalized}` : "";
}

export function getTeamMemberQrUrl(publicId) {
  const cardUrl = getTeamMemberCardUrl(publicId);
  return cardUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(cardUrl)}`
    : "";
}

export function getTeamMemberQrUrlWithFallback({ publicId, username }) {
  if (publicId) {
    return getTeamMemberQrUrl(publicId);
  }

  const publicUrl = getTeamMemberPublicUrl(username);
  return publicUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(publicUrl)}`
    : "";
}
