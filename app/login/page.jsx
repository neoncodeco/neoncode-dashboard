import { Suspense } from "react";
import LoginPageContent from "./LoginPageContent";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#000f08]" aria-busy="true" />}>
      <LoginPageContent />
    </Suspense>
  );
}
