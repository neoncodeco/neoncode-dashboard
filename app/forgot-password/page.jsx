import { Suspense } from "react";
import Loader from "@/components/Loader";
import ForgotPasswordClient from "@/components/SuspenClient/ForgotPasswordClient";

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<Loader />}>
      <ForgotPasswordClient />
    </Suspense>
  );
}
