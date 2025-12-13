"use client";
import React, { useState } from 'react';
import { 
  DollarSign, 
  Users, 
  CheckCircle, 
  XCircle, 
  Search, 
  Filter, 
  Download,
  MoreHorizontal
} from 'lucide-react';

// --- ডামি পেআউট ডাটা ---
const payoutsData = [
  { id: '#PAY-2021', affiliate: 'Sarah Connor', amount: '$150.00', method: 'PayPal', status: 'Pending', date: 'Oct 24, 2023', email: 'sarah@tech.io' },
  { id: '#PAY-2020', affiliate: 'Alex Johnson', amount: '$340.50', method: 'Bank Transfer', status: 'Approved', date: 'Oct 20, 2023', email: 'alex@gmail.com' },
  { id: '#PAY-2019', affiliate: 'Mike Ross', amount: '$50.00', method: 'PayPal', status: 'Rejected', date: 'Oct 18, 2023', email: 'mike@law.com' },
  { id: '#PAY-2018', affiliate: 'Jessica Pearson', amount: '$1,200.00', method: 'Bank Transfer', status: 'Approved', date: 'Oct 15, 2023', email: 'jessica@pearson.com' },
];

export default function AffiliatePayoutsPage() {
  const [filter, setFilter] = useState('All');

  // স্ট্যাটাস কালার
  const getStatusColor = (status) => {
    switch(status) {
      case 'Approved': return 'bg-green-100 text-green-700';
      case 'Pending': return 'bg-orange-100 text-orange-700';
      case 'Rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8">
      
      {/* --- ১. হেডার সেকশন --- */}
      <div className="pt-12 md:pt-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Affiliate Payouts</h1>
          <p className="text-gray-500 text-sm mt-1">Review and process affiliate withdrawal requests.</p>
        </div>
        
        <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition">
                <Download size={16} /> Export CSV
            </button>
        </div>
      </div>

      {/* --- ২. সামারি কার্ডস --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
            { label: 'Total Paid Out', value: '$12,450.00', trend: '+15%', color: 'text-green-600', icon: DollarSign },
            { label: 'Pending Requests', value: '12', trend: '$1,250 Total', color: 'text-orange-600', icon: Users },
            { label: 'Avg Commission', value: '$45.00', trend: 'Per Referral', color: 'text-blue-600', icon: CheckCircle },
        ].map((stat, idx) => (
            <div key={idx} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</h3>
                    <p className={`text-xs font-bold mt-1 ${stat.color}`}>{stat.trend}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-gray-600">
                    <stat.icon size={20} />
                </div>
            </div>
        ))}
      </div>

      {/* --- ৩. পেআউট টেবিল --- */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        
        {/* টেবিল হেডার এবং সার্চ */}
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row justify-between gap-4">
            <div className="relative flex-1 max-w-md">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Search affiliate name or ID..." 
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition"
                />
            </div>
            <div className="flex items-center gap-2">
                <Filter size={18} className="text-gray-400" />
                <select 
                    className="bg-gray-50 border border-gray-200 text-sm px-3 py-2 rounded-lg outline-none cursor-pointer hover:border-gray-300"
                    onChange={(e) => setFilter(e.target.value)}
                >
                    <option value="All">All Requests</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                </select>
            </div>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase border-b border-gray-200">
                        <th className="p-4 pl-6">Affiliate</th>
                        <th className="p-4">Amount</th>
                        <th className="p-4">Method</th>
                        <th className="p-4">Request Date</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right pr-6">Action</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {payoutsData.map((payout, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition group last:border-none">
                            
                            <td className="p-4 pl-6">
                                <p className="font-bold text-gray-900">{payout.affiliate}</p>
                                <p className="text-xs text-gray-500">{payout.email}</p>
                            </td>
                            
                            <td className="p-4 font-bold text-gray-900">{payout.amount}</td>
                            
                            <td className="p-4 text-gray-600">{payout.method}</td>
                            
                            <td className="p-4 text-gray-500">{payout.date}</td>

                            <td className="p-4">
                                <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${getStatusColor(payout.status)}`}>
                                    {payout.status}
                                </span>
                            </td>

                            <td className="p-4 text-right pr-6">
                                {payout.status === 'Pending' ? (
                                    <div className="flex justify-end gap-2">
                                        <button className="p-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition" title="Approve">
                                            <CheckCircle size={18} />
                                        </button>
                                        <button className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition" title="Reject">
                                            <XCircle size={18} />
                                        </button>
                                    </div>
                                ) : (
                                    <button className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition">
                                        <MoreHorizontal size={18} />
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* পেজিনেশন */}
        <div className="p-4 border-t border-gray-200 flex justify-between items-center text-sm text-gray-500">
            <span>Showing 1-4 of 12 requests</span>
            <div className="flex gap-2">
                <button className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50" disabled>Prev</button>
                <button className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50">Next</button>
            </div>
        </div>
      </div>

    </div>
  );
}