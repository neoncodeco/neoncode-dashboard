"use client";

import React, { useState } from "react";
import ReqAdAcModal from "@/components/ReqAdAcModal";
import AdAccountUi from "@/components/AdAccountUi";

export default function Overview() {
  const [isReqAdAcModalOpen, setIsReqAdAcModalOpen] = useState(false);

  return (
    <div className="user-dashboard-theme-scope min-h-screen space-y-8 bg-transparent px-6 pt-4 md:px-4 md:pt-0">
      <ReqAdAcModal
        isOpen={isReqAdAcModalOpen}
        onClose={() => setIsReqAdAcModalOpen(false)}
      />

      <AdAccountUi onRequestNewAccount={() => setIsReqAdAcModalOpen(true)} />
    </div>
  );
}
