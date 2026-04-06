"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Hash, DollarSign, Banknote, Landmark, Wallet } from 'lucide-react';
import CurrencyAmount from './CurrencyAmount';
import { formatUsd } from '@/lib/currency';

export default function MobileWalletCard({
  userData,
  usdToBdtRate,
  totalPayout,
}) {
  const walletBalance = Number(userData?.walletBalance || 0);
  const topupBalance = Number(userData?.topupBalance || 0);

  // Grid items setup according to your image
  const stats = [
    {
      label: 'Total Transactions',
      value: '0', // Ba dynamic data: userData?.totalTransactions || 0
      icon: <Hash className="w-5 h-5 text-gray-400" />,
      type: 'text'
    },
    {
      label: 'Dollar Topup',
      value: formatUsd(topupBalance),
      icon: <DollarSign className="w-5 h-5 text-emerald-400" />,
      type: 'usd'
    },
    {
      label: 'Buying Dollars',
      value: `৳${(topupBalance * (usdToBdtRate || 115)).toLocaleString()}`, 
      icon: <Banknote className="w-5 h-5 text-blue-500" />,
      type: 'bdt'
    },
    {
      label: 'Current Liability',
      value: `৳0.00`, 
      icon: <Landmark className="w-5 h-5 text-gray-500" />,
      type: 'bdt-muted'
    }
  ];

  return (
    <div className="w-full max-w-[400px] mx-auto space-y-4">
      {/* 2x2 Grid System (Like your image) */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="flex flex-col items-center justify-center p-5 rounded-[20px] border border-[var(--dashboard-frame-border)] bg-[rgba(255,255,255,0.02)] text-center"
          >
            <div className="mb-2 opacity-80">{item.icon}</div>
            <p className="text-[11px] font-medium dashboard-text-faint mb-1">
              {item.label}
            </p>
            <p className={`text-lg font-black tracking-tight ${
              item.type === 'usd' ? 'text-emerald-500' : 
              item.type === 'bdt' ? 'text-blue-500' : 'dashboard-text-strong'
            }`}>
              {item.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Main USD Balance (Wide Card at bottom like image) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center p-6 rounded-[24px] border border-[var(--dashboard-frame-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),transparent)] shadow-lg"
      >
        <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 mb-3">
          <Wallet className="w-6 h-6 text-emerald-500" />
        </div>
        <p className="text-[12px] font-bold uppercase tracking-[0.2em] dashboard-text-faint mb-1">
          USD Balance
        </p>
        
        <div className="text-center">
            <p className="text-3xl font-black text-emerald-500 leading-none">
                {formatUsd(walletBalance)}
            </p>
            <p className="mt-2 text-[10px] font-medium dashboard-text-faint">
                (Available ৳{(walletBalance * (usdToBdtRate || 115)).toLocaleString()})
            </p>
        </div>
      </motion.div>
    </div>
  );
}