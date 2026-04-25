
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import useAppAuth from '@/hooks/useAppAuth';

const LogoutModal = ({ setShowLogoutModal }) => {

    const { logout } = useAppAuth();

    const handleLogout = async () => {
        setShowLogoutModal(false);
        await logout("/login");
    };

    return (
        <div>
            <div className="fixed min-h-screen w-full inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity" onClick={() => setShowLogoutModal(false)}></div>
            
            {/* Modal Content */}
            <div className="relative bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl text-center transform transition-all scale-100">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="text-red-500" size={32} />
                </div>
                
                <h3 className="text-xl font-bold text-gray-800 mb-2">Sign Out?</h3>
                <p className="text-gray-500 text-sm mb-8">Are you sure you want to log out of your account?</p>
                
                <div className="flex gap-3">
                    <button 
                        onClick={() => setShowLogoutModal(false)}
                        className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleLogout}
                        className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition shadow-lg shadow-red-200"
                    >
                        Yes, Logout
                    </button>
                </div>
            </div>
        </div>
        </div>
    );
};

export default LogoutModal;
