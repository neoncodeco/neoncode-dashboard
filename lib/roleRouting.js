import { userDashboardRoutes } from "@/lib/userDashboardRoutes";

export function getDashboardPathByRole(role) {
  if (role === "admin" || role === "manager") {
    return "/admin-dashboard/overview";
  }

  if (role === "team_member") {
    return "/team-member-dashboard";
  }

  return userDashboardRoutes.dashboard;
}
