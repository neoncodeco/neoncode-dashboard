
"use client";

import Link from "next/link";
import { XCircle, ArrowLeft, RefreshCw, AlertCircle } from "lucide-react";
import { userDashboardRoutes } from "@/lib/userDashboardRoutes";

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        
        {/* Top Decorative Bar */}
        <div className="bg-red-500 h-2 w-full"></div>

        <div className="p-8 md:p-10 text-center">
          {/* Icon Section */}
          <div className="flex justify-center mb-6">
            <div className="bg-red-50 p-5 rounded-full ring-8 ring-red-50/50">
              <XCircle className="w-16 h-16 text-red-600" />
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">
            Payment Cancelled
          </h1>
          
          <p className="text-slate-500 mb-8 leading-relaxed">
            Your transaction was not completed. Don&apos;t worry, no funds have been deducted from your account.
          </p>

          {/* Info Notice Box */}
          <div className="bg-slate-50 rounded-2xl p-5 mb-10 flex items-start gap-4 text-left border border-slate-100">
            <AlertCircle className="w-6 h-6 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-1">
                Common reasons for cancellation:
              </p>
              <ul className="text-xs text-slate-500 space-y-1 list-disc ml-4">
                <li>Manually cancelled the process</li>
                <li>Session timeout or connection lost</li>
                <li>Incomplete payment authentication</li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-4">
            <Link 
              href={userDashboardRoutes.billing}
              className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all duration-200 shadow-lg shadow-blue-200 active:scale-95"
            >
              <RefreshCw className="w-5 h-5" />
              Try Again
            </Link>

          </div>
        </div>

        {/* Footer Support Info */}
        <div className="bg-slate-50 border-t border-slate-100 p-5 text-center">
          <p className="text-sm text-slate-400">
            Need help? <Link href={userDashboardRoutes.support} className="text-blue-500 hover:underline font-medium">Contact Support</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
