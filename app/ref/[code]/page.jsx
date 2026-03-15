import { redirect } from "next/navigation";

export default async function ReferralRedirectPage({ params }) {
  const resolvedParams = await params;
  const referralCode = String(resolvedParams?.code || "").trim().toUpperCase();

  if (!referralCode) {
    redirect("/register");
  }

  redirect(`/register?ref=${encodeURIComponent(referralCode)}`);
}
