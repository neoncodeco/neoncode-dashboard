import { redirect } from "next/navigation";
import { userDashboardRoutes } from "@/lib/userDashboardRoutes";

export default function UserDashboardIndexPage() {
  redirect(userDashboardRoutes.dashboard);
}
