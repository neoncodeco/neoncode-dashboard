"use client";

import React, { useState } from "react";
import ReqAdAcModal from "@/components/ReqAdAcModal";
import AdAccountUi from "@/components/AdAccountUi";

export default function Overview() {
  const [isReqAdAcModalOpen, setIsReqAdAcModalOpen] = useState(false);

  return (
    <div className="user-dashboard-theme-scope min-h-screen space-y-6 bg-transparent p-3 sm:space-y-8 sm:p-4 lg:p-6">
      <ReqAdAcModal
        isOpen={isReqAdAcModalOpen}
        onClose={() => setIsReqAdAcModalOpen(false)}
      />

      <AdAccountUi onRequestNewAccount={() => setIsReqAdAcModalOpen(true)} />
    </div>
  );
}
