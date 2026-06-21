import { Suspense } from "react";
import AuthErrorContent from "./AuthErrorContent";

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#000f08]" aria-busy="true" />}>
      <AuthErrorContent />
    </Suspense>
  );
}
