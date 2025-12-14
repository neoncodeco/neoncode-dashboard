
import Loader from "@/components/Loader";
import RegisterClient from "@/components/SuspenClient/RegisterClient";
import { Suspense } from "react";


export default function RegisterPage() {
  return (
    <Suspense fallback={<Loader />}>
      <RegisterClient />
    </Suspense>
  );
}