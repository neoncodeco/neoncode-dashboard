import LiveChatButton from "@/components/chat/LiveChatButton";
import DashboardMouseGlow from "@/components/DashboardMouseGlow";
import UserSidebar from "@/components/UserSidebar";

export default function MainLayout({ children }) {
  return (
    <div className="dashboard-shell neon-grid flex h-screen w-full overflow-hidden">
      <DashboardMouseGlow />
      {/* ইউজার সাইডবার শুধু এখানেই থাকবে */}
      <UserSidebar />

      {/* মেইন কন্টেন্ট */}
      <div className="dashboard-content flex-1 h-full overflow-y-auto">{children}</div>

      <LiveChatButton />
    </div>
  );
}
