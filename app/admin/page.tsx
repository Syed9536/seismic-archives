"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { useAccount } from 'wagmi'; 
import { checkIsAdmin } from "@/utils/admins"; 
import { ShieldAlert, User, ExternalLink, Loader2, Lock, LayoutDashboard, Search } from "lucide-react";
import Link from "next/link";
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function AdminDashboard() {
  const { address, isConnected } = useAccount();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalUploads: 0, totalUsers: 0 });

  // 1. Auth & Data Fetching
  useEffect(() => {
    const init = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        // Admin Check
        const discordId = user?.user_metadata?.provider_id || user?.identities?.find((id: any) => id.provider === 'discord')?.id;
        const isAdmin = checkIsAdmin(address, discordId);
        
        if (isAdmin) {
            fetchGlobalData(); 
        } else {
            setLoading(false);
        }
    };
    init();
  }, [address]);

  // 2. Fetch All Contributors
  const fetchGlobalData = async () => {
    const { data } = await supabase.from("archives").select("*").order("created_at", { ascending: false });
    
    if (data) {
        // Stats Calculation
        setStats({ totalUploads: data.length, totalUsers: new Set(data.map(i => i.wallet_address || i.user_id)).size });

        // Unique Users Grouping
        const userMap = new Map();
        
        data.forEach(item => {
            // Identifier: Wallet Address or User ID
            const id = item.wallet_address !== "Discord-User" ? item.wallet_address : item.user_id;
            const displayName = item.wallet_address !== "Discord-User" ? item.wallet_address : (item.discord_id || "Discord User");
            
            if (!userMap.has(id)) {
                userMap.set(id, {
                    id: id,
                    displayName: displayName,
                    type: item.wallet_address !== "Discord-User" ? "Wallet" : "Discord",
                    lastActive: item.created_at,
                    uploadCount: 1,
                    latestUpload: item.image_url
                });
            } else {
                const existing = userMap.get(id);
                existing.uploadCount += 1;
                userMap.set(id, existing);
            }
        });
        setAllUsers(Array.from(userMap.values()));
    }
    setLoading(false);
  };

  const discordId = user?.user_metadata?.provider_id || user?.identities?.find((id: any) => id.provider === 'discord')?.id;
  const isAdmin = checkIsAdmin(address, discordId);

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center"><Loader2 className="animate-spin text-green-500 w-12 h-12" /></div>;

  return (
    <div className="min-h-screen bg-black text-white font-mono p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-12 border-b border-gray-800 pb-6 gap-4">
            <div className="flex items-center gap-3">
                 <div className="bg-red-900/20 p-3 rounded-xl border border-red-900/50">
                    <ShieldAlert className="text-red-500 w-8 h-8" />
                 </div>
                 <div>
                    <h1 className="text-3xl font-bold text-white tracking-tighter">SEISMIC <span className="text-red-600">OVERWATCH</span></h1>
                    <p className="text-gray-500 text-xs tracking-widest uppercase">Classified Admin Console</p>
                 </div>
            </div>
            
            <div className="flex gap-4 items-center">
                 <Link href="/" className="text-gray-400 hover:text-white text-sm font-bold border border-gray-800 px-4 py-2 rounded-lg transition">
                    &larr; EXIT TO HOME
                 </Link>
                {!user && !isConnected && <ConnectButton />}
            </div>
        </header>

        {/* --- ACCESS DENIED VIEW --- */}
        {!isAdmin ? (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-6 border border-red-900/30 bg-red-900/5 rounded-2xl p-10">
                <Lock size={64} className="text-red-700" />
                <h2 className="text-3xl font-bold text-red-500">RESTRICTED ACCESS</h2>
                <p className="text-gray-400 max-w-md">
                    This channel is encrypted. Only Whitelisted Seismic Operatives can access the global contribution log.
                </p>
                <div className="p-4 bg-black border border-red-900 rounded-xl text-red-400 text-sm font-mono">
                    ERROR: IDENTITY_NOT_VERIFIED
                </div>
            </div>
        ) : (
            
        /* --- ADMIN DASHBOARD VIEW --- */
            <div className="space-y-8 animate-in fade-in duration-700">
                
                {/* STATS CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gray-900/30 border border-gray-800 p-6 rounded-xl">
                        <h3 className="text-gray-500 text-xs font-bold uppercase flex items-center gap-2"><User size={14}/> Total Contributors</h3>
                        <p className="text-4xl font-bold text-white mt-2">{stats.totalUsers}</p>
                    </div>
                    <div className="bg-gray-900/30 border border-gray-800 p-6 rounded-xl">
                        <h3 className="text-gray-500 text-xs font-bold uppercase flex items-center gap-2"><LayoutDashboard size={14}/> Total Artifacts</h3>
                        <p className="text-4xl font-bold text-green-500 mt-2">{stats.totalUploads}</p>
                    </div>
                     <div className="bg-gray-900/30 border border-gray-800 p-6 rounded-xl">
                        <h3 className="text-gray-500 text-xs font-bold uppercase flex items-center gap-2"><ShieldAlert size={14}/> Security Level</h3>
                        <p className="text-4xl font-bold text-red-500 mt-2">MAXIMUM</p>
                    </div>
                </div>

                {/* SEARCH BAR (Visual only for now) */}
                <div className="flex justify-between items-end">
                    <h3 className="text-xl font-bold text-gray-300 flex items-center gap-2">
                        Active Nodes (Contributors)
                        <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-full">{allUsers.length}</span>
                    </h3>
                    <div className="relative hidden md:block">
                        <Search className="absolute left-3 top-3 text-gray-600 w-4 h-4" />
                        <input type="text" placeholder="Search hash..." className="bg-black border border-gray-800 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-300 focus:border-green-500 outline-none w-64" disabled />
                    </div>
                </div>
                
                {/* USERS TABLE */}
                <div className="border border-gray-800 rounded-xl overflow-hidden bg-gray-900/10">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-900/50 text-gray-400 text-xs uppercase border-b border-gray-800">
                                <th className="p-4 font-bold">Identity (Wallet / User ID)</th>
                                <th className="p-4 font-bold">Type</th>
                                <th className="p-4 font-bold">Uploads</th>
                                <th className="p-4 font-bold">Last Active</th>
                                <th className="p-4 font-bold text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {allUsers.map((contributor) => (
                                <tr key={contributor.id} className="hover:bg-gray-900/30 transition group">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center text-gray-500 overflow-hidden">
                                                {contributor.latestUpload ? <img src={contributor.latestUpload} className="w-full h-full object-cover opacity-50" /> : <User size={16} />}
                                            </div>
                                            <span className="font-mono text-sm text-green-400 truncate max-w-[200px]">{contributor.displayName}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-xs font-bold text-gray-500">{contributor.type.toUpperCase()}</td>
                                    <td className="p-4 font-bold text-white">{contributor.uploadCount}</td>
                                    <td className="p-4 text-xs text-gray-500 font-mono">{new Date(contributor.lastActive).toLocaleDateString()}</td>
                                    <td className="p-4 text-right">
                                        <Link href={`/u/${contributor.id}`}>
                                            <button className="bg-green-900/10 hover:bg-green-500 text-green-500 hover:text-black border border-green-900 hover:border-green-500 px-3 py-1 rounded text-xs font-bold transition flex items-center gap-2 ml-auto">
                                                INSPECT VAULT <ExternalLink size={12} />
                                            </button>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    {allUsers.length === 0 && (
                        <div className="text-center py-10 text-gray-500 text-sm">No contributors found yet.</div>
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
}