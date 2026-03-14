import { Suspense } from "react";
import Loader from "@/components/Loader";
import ResetPasswordClient from "@/components/SuspenClient/ResetPasswordClient";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Loader />}>
      <ResetPasswordClient />
    </Suspense>
  );
}
