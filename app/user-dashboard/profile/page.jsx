"use client";
import React, { useState, useEffect } from 'react';
import { 
  Camera, User, Mail, Phone, Save, Loader2, 
  CheckCircle, Wallet, Gift, Shield, 
  ArrowRight, Globe, CreditCard
} from 'lucide-react';
import useFirebaseAuth from "@/hooks/useFirebaseAuth";

export default function FullProfilePage() {
  const { userData, token, refreshUser } = useFirebaseAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  // মেইন স্টেট
  const [formData, setFormData] = useState({
    name: '',
    photo: '',
    coverPhoto: '',
  });

  // পেমেন্ট মেথডসের জন্য আলাদা স্টেট
  const [paymentMethods, setPaymentMethods] = useState({});

  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || '',
        photo: userData.photo || '',
        coverPhoto: userData.coverPhoto || '',
      });
      // ডাটাবেস থেকে সব পেমেন্ট মেথড লোড করা (bkash, nagad, etc.)
      setPaymentMethods(userData.payoutMethods || {});
    }
  }, [userData]);

  const saveProfile = async (nextFormData, nextPaymentMethods, options = {}) => {
    const { silent = false, successMessage = "Profile updated successfully!" } = options;
    if (!token) return false;
    if (!silent) {
      setLoading(true);
      setStatus({ type: '', message: '' });
    }

    try {
      const res = await fetch("/api/update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...nextFormData,
          payoutMethods: nextPaymentMethods
        }),
      });

      if (res.ok) {
        setStatus({ type: 'success', message: successMessage });
        await refreshUser();
        return true;
      }

      setStatus({ type: 'error', message: 'Update failed' });
      return false;
    } catch (error) {
      setStatus({ type: 'error', message: 'Error occurred!' });
      return false;
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  // ইমেজ আপলোড (ImgBB)
  const handleImageUpload = async (e, target = "photo") => {
    const file = e.target.files[0];
    if (!file) return;
    if (target === "cover") {
      setUploadingCover(true);
    } else {
      setUploadingPhoto(true);
    }
    const uploadData = new FormData();
    uploadData.append("image", file);

    try {
      const res = await fetch("/api/upload/screenshot", { method: "POST", body: uploadData });
      const data = await res.json();
      if (data.url) {
        const key = target === "cover" ? "coverPhoto" : "photo";
        const nextFormData = { ...formData, [key]: data.url };
        setFormData(nextFormData);
        await saveProfile(
          nextFormData,
          paymentMethods,
          {
            silent: true,
            successMessage: target === "cover" ? "Cover photo updated." : "Profile photo updated."
          }
        );
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Upload failed' });
    } finally {
      if (target === "cover") {
        setUploadingCover(false);
      } else {
        setUploadingPhoto(false);
      }
    }
  };

  // পেমেন্ট ইনপুট হ্যান্ডলার (ডাইনামিক)
  const handlePaymentChange = (methodKey, value) => {
    setPaymentMethods(prev => ({
      ...prev,
      [methodKey]: { ...prev[methodKey], number: value }
    }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    await saveProfile(formData, paymentMethods, { silent: false });
  };

  return (
    <div className="min-h-screen text-black pb-20">
      {/* Header Banner */}
      <div
        className="h-56 md:h-72 relative overflow-hidden bg-gradient-to-r from-indigo-700 to-sky-700"
        style={
          formData.coverPhoto
            ? { backgroundImage: `linear-gradient(rgba(2, 6, 23, 0.45), rgba(2, 6, 23, 0.45)), url(${formData.coverPhoto})`, backgroundSize: "cover", backgroundPosition: "center" }
            : undefined
        }
      >
        <label className="absolute right-4 top-4 px-3 py-2 bg-black/40 text-white rounded-xl shadow-lg cursor-pointer hover:bg-black/60 transition text-xs font-bold">
          {uploadingCover ? "Uploading..." : "Change Cover"}
          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, "cover")} />
        </label>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-12 -mt-14 md:-mt-16 relative z-10">
        <div className="flex flex-col md:flex-row items-start md:items-end gap-4 md:gap-6 mb-8">
          <div className="relative group">
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-3xl bg-white p-1 shadow-2xl overflow-hidden border-4 border-white shrink-0">
              {formData.photo ? (
                <img src={formData.photo} alt="Profile" className="w-full h-full object-cover object-center rounded-2xl" />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-2xl text-gray-300"><User size={50} /></div>
              )}
              {uploadingPhoto && <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-2xl"><Loader2 className="text-white animate-spin" /></div>}
            </div>
            <label className="absolute bottom-2 right-2 p-2 bg-indigo-600 text-white rounded-xl shadow-lg cursor-pointer hover:scale-110 transition">
              <Camera size={18} />
              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, "photo")} />
            </label>
          </div>
          <div className="text-white font-medium min-w-0 pb-2">
            <h1 className="text-2xl md:text-3xl font-black drop-shadow-md truncate">{formData.name || "User"}</h1>
            <p className="flex items-center gap-2 mt-1 opacity-90 truncate text-sm md:text-base"><Mail size={14} /> {userData?.email}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Info */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Shield size={18} className="text-indigo-600"/> Account Info</h3>
            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-gray-50 rounded-2xl text-sm">
                <span className="text-gray-500">Referral Code</span>
                <span className="font-black text-indigo-600">{userData?.referralCode}</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded-2xl text-sm">
                <span className="text-gray-500">Joined On</span>
                <span className="font-medium">{userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div className="lg:col-span-8">
          <form onSubmit={handleUpdate} className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-gray-100 space-y-10">
            
            {/* Personal Info Section */}
            <section>
              <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <User size={20} className="text-indigo-600" /> General Settings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Full Name</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:border-indigo-500 transition outline-none" 
                  />
                </div>
                <div className="space-y-2 opacity-60">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Email (Private)</label>
                  <input type="email" value={userData?.email || ''} readOnly className="w-full px-5 py-3.5 bg-gray-100 border border-gray-200 rounded-2xl cursor-not-allowed outline-none" />
                </div>
              </div>
            </section>

            {/* Dynamic Payment Methods Section */}
            <section>
              <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <CreditCard size={20} className="text-pink-600" /> Payout Methods
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.keys(paymentMethods).length > 0 ? (
                  Object.keys(paymentMethods).map((key) => (
                    <div key={key} className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">{key} Number</label>
                      <div className="relative">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-pink-500 text-xs uppercase">{key}</span>
                        <input 
                          type="text" 
                          placeholder={`Enter ${key} number`}
                          value={paymentMethods[key]?.number || ''}
                          onChange={(e) => handlePaymentChange(key, e.target.value)}
                          className="w-full pl-20 pr-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:border-pink-500 transition outline-none" 
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 italic">No payment methods found in database.</p>
                )}
              </div>
            </section>

            {/* Submit Bar */}
            <div className="pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-sm">
                {status.message && (
                  <p className={`flex items-center gap-2 font-medium ${status.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                    {status.type === 'success' && <CheckCircle size={18} />} {status.message}
                  </p>
                )}
              </div>
              <button 
                type="submit"
                disabled={loading || uploadingPhoto || uploadingCover}
                className="w-full md:w-auto flex items-center justify-center gap-3 px-12 py-4 rounded-2xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition transform hover:-translate-y-1 active:scale-95"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
