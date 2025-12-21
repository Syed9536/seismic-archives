"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { useAccount } from 'wagmi'; 
import { checkIsAdmin } from "@/utils/admins"; // Step 1 wali file import ki
import { ShieldAlert, User, ExternalLink, Loader2, Lock } from "lucide-react";
import Link from "next/link";
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function AdminDashboard() {
  const { address, isConnected } = useAccount();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  // 1. Check Auth & Admin Status
  useEffect(() => {
    const init = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        // Agar banda login hai, toh check karo Admin hai ya nahi
        const isAdmin = checkIsAdmin(address, user?.user_metadata?.provider_id);
        
        if (isAdmin) {
            fetchGlobalStats(); // Agar Admin hai, tabhi data lao
        } else {
            setLoading(false);
        }
    };
    init();
  }, [address]);

  // 2. Fetch Unique Contributors
  const fetchGlobalStats = async () => {
    // Sabhi archives le aao
    const { data } = await supabase.from("archives").select("user_id, wallet_address, created_at, discord_id").order("created_at", { ascending: false });
    
    if (data) {
        // Unique Users nikaalo (Based on user_id or wallet)
        const unique = new Map();
        data.forEach(item => {
            const key = item.user_id || item.wallet_address;
            if (!unique.has(key)) {
                unique.set(key, {
                    id: key,
                    type: item.user_id ? "Discord User" : "Wallet User",
                    last_active: item.created_at,
                    discord_id: item.discord_id
                });
            }
        });
        setAllUsers(Array.from(unique.values()));
    }
    setLoading(false);
  };

  const isAdmin = checkIsAdmin(address, user?.user_metadata?.provider_id);

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center"><Loader2 className="animate-spin text-green-500" /></div>;

  return (
    <div className="min-h-screen bg-black text-white font-mono p-8">
      <div className="max-w-6xl mx-auto">
        
        <header className="flex justify-between items-center mb-12 border-b border-gray-800 pb-6">
            <h1 className="text-3xl font-bold flex items-center gap-3 text-red-500">
                <ShieldAlert /> SEISMIC OVERWATCH
            </h1>
            <div className="flex gap-4">
                {!user && !isConnected && <ConnectButton />}
                {user && <div className="text-sm bg-gray-900 px-3 py-2 rounded text-gray-400">Logged in as {user.email || "Discord User"}</div>}
            </div>
        </header>

        {/* --- ACCESS DENIED VIEW --- */}
        {!isAdmin ? (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-6">
                <Lock size={64} className="text-gray-700" />
                <h2 className="text-2xl font-bold text-gray-500">RESTRICTED AREA</h2>
                <p className="text-gray-400 max-w-md">
                    This channel is encrypted. Only Whitelisted Seismic Operatives can access the global contribution log.
                </p>
                <div className="p-4 bg-red-900/20 border border-red-900 rounded-xl text-red-400 text-sm">
                    ⚠️ Access Denied: Wallet/ID not recognized.
                </div>
            </div>
        ) : (
            
        /* --- ADMIN DASHBOARD VIEW --- */
            <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gray-900/30 border border-gray-800 p-6 rounded-xl">
                        <h3 className="text-gray-500 text-xs font-bold uppercase">Total Contributors</h3>
                        <p className="text-4xl font-bold text-white mt-2">{allUsers.length}</p>
                    </div>
                </div>

                <h3 className="text-xl font-bold mb-6 text-gray-300">Active Nodes (Contributors)</h3>
                
                <div className="grid gap-4">
                    {allUsers.map((contributor) => (
                        <Link key={contributor.id} href={`/u/${contributor.id}`}>
                            <div className="group bg-black border border-gray-800 hover:border-green-500 p-4 rounded-xl flex items-center justify-between transition-all cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <div className="bg-gray-900 p-3 rounded-full">
                                        <User className="text-gray-400 group-hover:text-green-500" />
                                    </div>
                                    <div>
                                        <p className="font-mono text-sm text-green-400">{contributor.id}</p>
                                        <p className="text-xs text-gray-600 mt-1">{contributor.type} • Last Active: {new Date(contributor.last_active).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600 group-hover:text-white text-xs font-bold">
                                    INSPECT VAULT <ExternalLink size={14} />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
}