import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { auth } from "@/lib/auth";
import getDB from "@/lib/mongodb";

function resolveAdminTarget(rawTarget) {
  const value = String(rawTarget || "").trim();
  if (!value.startsWith("/admin-dashboard")) {
    return "/admin-dashboard/overview";
  }
  return value;
}

export default async function AdminAccessPage({ searchParams }) {
  const requestedTarget = resolveAdminTarget(searchParams?.next);
  const session = await auth();

  if (session?.user?.uid) {
    const { db } = await getDB();
    const user = await db.collection("users").findOne(
      { userId: session.user.uid },
      { projection: { role: 1, email: 1, name: 1 } }
    );

    if (user && ["admin", "manager"].includes(String(user.role || "").toLowerCase())) {
      redirect(requestedTarget);
    }
  }

  const signedInEmail = session?.user?.email || "";

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7fafc_0%,#eef5ff_100%)] px-4 py-10">
      <div className="mx-auto max-w-xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:p-8">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <ShieldAlert size={26} />
        </div>

        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
          Administrator Access Required
        </p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
          Please sign in as an administrator first
        </h1>

        <p className="mt-4 text-sm leading-6 text-slate-600">
          This email link can only be opened by a signed-in administrator or manager account.
        </p>

        {signedInEmail ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            You are currently signed in as <span className="font-bold">{signedInEmail}</span>, but this account does
            not have administrator access.
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
            You are not signed in right now. Please log in with your administrator account to continue.
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-2xl bg-[#b7df69] px-5 py-3 text-sm font-black text-[#17210e] shadow-sm transition hover:brightness-95"
          >
            Sign In as Admin
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Go to Home
          </Link>
        </div>

        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Once you are signed in with an administrator account, opening the same email button again will take you
              directly to the correct admin dashboard page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
