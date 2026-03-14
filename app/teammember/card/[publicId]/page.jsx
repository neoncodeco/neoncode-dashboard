import { notFound, redirect } from "next/navigation";
import { getTeamMemberPublicUrl } from "@/lib/teamMemberProfile";
import { getPublicTeamMemberByPublicId } from "@/lib/teamMemberPublic";

export const dynamic = "force-dynamic";

export default async function TeamMemberCardRedirectPage({ params }) {
  const { publicId } = await params;
  const data = await getPublicTeamMemberByPublicId(publicId);

  if (!data?.username) {
    notFound();
  }

  redirect(getTeamMemberPublicUrl(data.username));
}
