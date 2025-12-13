import UserSidebar from "@/components/UserSidebar";

export default function MainLayout({ children }) {
  return (
    <div className="flex h-screen w-full bg-[#f3f4f6] overflow-hidden">
      
      {/* ইউজার সাইডবার শুধু এখানেই থাকবে */}
      <UserSidebar/>

      {/* মেইন কন্টেন্ট */}
      <div className="flex-1 h-full overflow-y-auto">
        {children}
      </div>

    </div>
  );
}