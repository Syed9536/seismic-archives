"use client";

import { supabase } from "@/utils/supabase/client";
import { useState, useEffect } from "react";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi'; 
import { checkIsAdmin } from "@/utils/admins"; 
import { Ghost, UploadCloud, ShieldCheck, Disc, LogOut, User, Loader2, ShieldAlert, LayoutDashboard, Lock, Trash2, CheckCircle, ExternalLink } from "lucide-react"; 
import Link from "next/link";

// --- ADMIN HELPER FUNCTIONS ---
const deleteArtifact = async (artifactId: string, filePath: string) => {
  if(!confirm("⚠️ Delete this item permanently?")) return;
  try {
    if (filePath) {
        await supabase.storage.from('artifacts').remove([filePath]);
    }
    const { error: dbError } = await supabase.from('archives').delete().eq('id', artifactId);
    if (dbError) throw dbError;
    return { success: true };
  } catch (error) {
    console.error("Delete failed:", error);
    alert("Delete failed.");
    return { success: false };
  }
};

export default function Home() {
  const { address, isConnected } = useAccount(); 
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false); 

  // --- DASHBOARD DATA ---
  const [userArtifacts, setUserArtifacts] = useState<any[]>([]); 
  const [users, setUsers] = useState<any[]>([]); 
  const [activeTab, setActiveTab] = useState('all'); 

  // --- 1. AUTH ---
  useEffect(() => {
    const handleAuth = async () => {
      setAuthLoading(true);
      try {
        const hash = window.location.hash;
        if (hash && hash.includes("access_token")) {
            const params = new URLSearchParams(hash.substring(1));
            const accessToken = params.get("access_token");
            if (accessToken) {
              const { data } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: params.get("refresh_token") || "",
              });
              if (data.session) setUser(data.session.user);
            }
        }
        const { data: { session } } = await supabase.auth.getSession();
        if (session) setUser(session.user);
      } catch(e) { console.error(e); }
      setAuthLoading(false);
    };
    handleAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) setUser(session.user);
      if (event === 'SIGNED_OUT') setUser(null);
      setAuthLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  // --- 2. ADMIN DATA FETCHING ---
  useEffect(() => {
    // Wrap in async function to avoid useEffect async issues
    const runAdminLogic = async () => {
        const discordId = user?.user_metadata?.provider_id || user?.identities?.find((id: any) => id.provider === 'discord')?.id;
        const adminStatus = checkIsAdmin(address, discordId);
        setIsAdmin(adminStatus || false);

        if (adminStatus) {
            try {
                const { data: artifactsData, error } = await supabase.from('archives').select('*').order('created_at', { ascending: false });
                
                if (error) throw error;
                if (artifactsData) {
                    setUserArtifacts(artifactsData);

                    // --- SMART GROUPING ---
                    const groupedMap = artifactsData.reduce((acc: any, curr: any) => {
                        const identity = curr.wallet_address || curr.user_id || 'unknown'; 
                        
                        if(!acc[identity]) {
                            // Safe Avatar & Name
                            const seed = identity === 'unknown' ? 'default' : identity;
                            const autoAvatar = `https://api.dicebear.com/9.x/identicon/svg?seed=${seed}`;
                            
                            let displayName = "Contributor";
                            if(curr.username) displayName = curr.username;
                            else if(identity.startsWith('0x')) displayName = identity.slice(0,6) + "..." + identity.slice(-4);
                            else displayName = "User " + identity.slice(0,4);

                            acc[identity] = { 
                                id: identity,
                                username: displayName,
                                avatar: curr.avatar_url || autoAvatar, 
                                artifacts: [],
                                isUpgraded: false
                            };
                        }
                        
                        // Metadata Refinement from newer rows
                        if(curr.username) acc[identity].username = curr.username;
                        if(curr.avatar_url) acc[identity].avatar = curr.avatar_url;

                        acc[identity].artifacts.push(curr);
                        if(curr.status === 'verified') acc[identity].isUpgraded = true;
                        
                        return acc;
                    }, {});
                    
                    setUsers(Object.values(groupedMap));
                }
            } catch (err) {
                console.error("Fetch Error:", err);
            }
        }
    };
    runAdminLogic();
  }, [user, address]);

  const handleDiscordLogin = async () => {
    setAuthLoading(true);
    await supabase.auth.signInWithOAuth({ provider: 'discord', options: { redirectTo: window.location.origin } });
  };
  const handleLogout = async () => { await supabase.auth.signOut(); setUser(null); };

  const displayedUsers = users.filter(u => {
    if (activeTab === 'ready_for_upgrade') return u.isUpgraded === true;
    return true;
  });

  // Safe User Display Name
  const getUserName = () => {
      return user?.user_metadata?.full_name || user?.email?.split('@')[0] || "User";
  }

  return (
    <div className="min-h-screen bg-black text-white font-mono selection:bg-green-500 selection:text-black">
      
      {/* NAVBAR */}
      <nav className="border-b border-green-900/50 p-6 flex justify-between items-center backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-green-500 w-8 h-8" />
          <span className="text-2xl font-bold tracking-tighter">
            SEISMIC <span className="text-green-500">ARCHIVES</span>
          </span>
        </div>
        
        <div className="flex gap-4 items-center">
          {isAdmin && (
            <Link href="/admin">
                {/* Fixed: Button removed, styles applied to div/button replacement or directly */}
                <div className="hidden md:flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-[0_0_15px_rgba(220,38,38,0.6)] animate-pulse transition cursor-pointer">
                    <LayoutDashboard size={14} /> ADMIN PANEL
                </div>
            </Link>
          )}
          
          {user && (
            <div className="hidden md:flex items-center gap-2 text-xs text-green-400 border border-green-900 px-3 py-1 rounded-full bg-green-900/10">
               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
               {getUserName().split(" ")[0]}
            </div>
          )}
          <div className="shadow-[0_0_15px_rgba(34,197,94,0.3)] rounded-xl">
            <ConnectButton showBalance={false} accountStatus="address" chainStatus="icon"/>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-8 mt-10">
        {authLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <Loader2 className="animate-spin text-green-500 w-16 h-16 mb-4" />
                <h2 className="text-2xl font-bold animate-pulse">AUTHENTICATING...</h2>
            </div>
        ) : (
            <>
                <div className="text-center space-y-6 mb-20">
                <h1 className="text-5xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-600">
                    {(user || isConnected) ? "ACCESS" : "PROOF OF"} <br /> 
                    <span className="text-green-500">{(user || isConnected) ? "GRANTED" : "CONTRIBUTION"}</span>
                </h1>
                
                {isAdmin && (
                    <div className="max-w-md mx-auto bg-red-900/10 border border-red-900 p-3 rounded-lg text-red-400 text-sm font-bold flex items-center justify-center gap-2">
                        <ShieldAlert size={16} /> Welcome, Administrator.
                    </div>
                )}
                
                <p className="text-gray-400 text-xl max-w-2xl mx-auto">
                    {user 
                    ? `Welcome back, ${getUserName()}.` 
                    : isConnected 
                        ? "Wallet Connected. You may verify with Discord for full access."
                        : "The decentralized vault for Seismic Community artifacts."}
                </p>
                </div>

                {/* USER ACTION CARDS */}
                <div className="flex flex-col md:flex-row gap-6 items-stretch justify-center mb-20">
                    <div className="flex-1 w-full">
                        {!user ? (
                        <div onClick={handleDiscordLogin} className="group border border-gray-800 bg-gray-900/40 p-10 rounded-2xl hover:border-indigo-500/50 transition-all cursor-pointer relative overflow-hidden h-full flex flex-col justify-between">
                            <div>
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Disc size={100} /></div>
                                <div className="bg-indigo-500/10 w-fit p-3 rounded-xl mb-6"><Ghost className="text-indigo-400 w-8 h-8" /></div>
                                <h3 className="text-2xl font-bold mb-2 group-hover:text-indigo-400 transition-colors">Sync Discord</h3>
                                <p className="text-gray-400 mb-6">Link your Discord identity for full verification.</p>
                            </div>
                            <span className="text-indigo-400 text-sm font-bold flex items-center gap-2 animate-pulse">CONNECT NOW &rarr;</span>
                        </div>
                        ) : (
                        <div className="border border-green-500/50 bg-green-900/10 p-10 rounded-2xl relative overflow-hidden flex flex-col justify-between h-full">
                            <div className="absolute top-0 right-0 p-4 opacity-10"><User size={100} /></div>
                            <div>
                            <div className="flex items-center gap-4 mb-6">
                                <img src={user?.user_metadata?.avatar_url} className="w-20 h-20 rounded-full border-4 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.5)]" />
                                <div>
                                <h3 className="text-3xl font-bold text-white">{getUserName()}</h3>
                                <p className="text-green-400 text-sm font-mono tracking-wider">VERIFIED</p>
                                </div>
                            </div>
                            <button onClick={handleLogout} className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition border border-red-900/30"><LogOut size={16} /> DISCONNECT</button>
                            </div>
                        </div>
                        )}
                    </div>
                    <div className="flex-1 w-full">
                        {user ? (
                            <Link href="/upload">
                            <div className="group border border-gray-800 bg-gray-900/40 p-10 rounded-2xl hover:border-green-500/50 transition-all cursor-pointer relative overflow-hidden h-full flex flex-col justify-between">
                                <div>
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><UploadCloud size={100} /></div>
                                <div className="bg-green-500/10 w-fit p-3 rounded-xl mb-6"><UploadCloud className="text-green-400 w-8 h-8" /></div>
                                <h3 className="text-2xl font-bold mb-2 group-hover:text-green-400 transition-colors">Manual Upload</h3>
                                <p className="text-gray-400 mb-6">Upload your contribution and save to vault.</p>
                                </div>
                                <span className="text-green-400 text-sm font-bold flex items-center gap-2">START UPLOAD &rarr;</span>
                            </div>
                            </Link>
                        ) : (
                            <div className="border border-gray-800 bg-black/40 p-10 rounded-2xl relative overflow-hidden h-full flex flex-col justify-between opacity-50 cursor-not-allowed">
                                <div>
                                    <div className="absolute top-0 right-0 p-4 opacity-5"><UploadCloud size={100} /></div>
                                    <div className="bg-gray-800/50 w-fit p-3 rounded-xl mb-6"><Lock className="text-gray-500 w-8 h-8" /></div>
                                    <h3 className="text-2xl font-bold mb-2 text-gray-500">Manual Upload</h3>
                                    <p className="text-gray-600 mb-6">Verify your Discord identity to unlock upload access.</p>
                                </div>
                                <span className="text-gray-600 text-sm font-bold flex items-center gap-2">LOCKED 🔒</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 🔥 ADMIN CONTROL CENTER (HTML FIXED) 🔥 */}
                {isAdmin && (
                  <div className="border-t border-red-900/50 pt-10 mt-10">
                    <h2 className="text-2xl font-black text-red-600 mb-6 flex items-center gap-2">
                        <ShieldAlert /> OVERWATCH CONTROLS
                    </h2>

                    {/* TABS */}
                    <div className="flex gap-4 mb-6">
                        <button onClick={() => setActiveTab('all')} className={`text-sm px-4 py-2 rounded transition border ${activeTab === 'all' ? 'bg-gray-800 text-white border-gray-600' : 'text-gray-500 border-transparent hover:border-gray-800'}`}>
                            All Contributors
                        </button>
                        <button onClick={() => setActiveTab('ready_for_upgrade')} className={`text-sm border border-green-500/30 px-4 py-2 rounded transition flex items-center gap-2 ${activeTab === 'ready_for_upgrade' ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'text-gray-500 border-transparent hover:text-green-400'}`}>
                            Verified / Upgraded 🎖️
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        
                        {/* LIST 1: INCOMING STREAM */}
                        <div className="bg-gray-950 p-6 rounded-xl border border-gray-800">
                            <h3 className="text-gray-400 font-bold mb-4 text-xs tracking-widest">INCOMING STREAM</h3>
                            <div className="max-h-[400px] overflow-y-auto pr-2 space-y-2">
                                {userArtifacts.length === 0 && <p className="text-gray-600 text-sm p-4 text-center">No artifacts found.</p>}
                                {userArtifacts.map((item) => (
                                    <div key={item.id} className="flex justify-between items-center bg-gray-900 p-4 rounded border border-gray-800">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="text-white min-w-0">
                                                <p className="font-bold truncate max-w-[150px]">
                                                    {item.filename || item.name || `Artifact ${item.id.slice(0,4)}`}
                                                </p>
                                                <span className={`text-[10px] px-2 py-0.5 rounded ${
                                                    item.status === 'verified' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                                                }`}>
                                                    {item.status?.toUpperCase() || 'PENDING'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                            <button 
                                                onClick={async () => {
                                                    const res = await deleteArtifact(item.id, item.file_path);
                                                    if(res.success) {
                                                        setUserArtifacts(prev => prev.filter(a => a.id !== item.id));
                                                    }
                                                }}
                                                className="p-2 bg-red-900/20 hover:bg-red-900/50 text-red-500 rounded transition"
                                            >
                                                <Trash2 size={16} />
                                            </button>

                                            {/* HTML FIX: Use div instead of button inside Link */}
                                            <Link href={`/u/${item.user_id || item.wallet_address || '#'}`}>
                                                <div className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded cursor-pointer">
                                                    <ExternalLink size={16} />
                                                </div>
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* LIST 2: ACTIVE NODES */}
                        <div className="bg-gray-950 p-6 rounded-xl border border-gray-800">
                             <h3 className="text-gray-400 font-bold mb-4 text-xs tracking-widest">
                                {activeTab === 'ready_for_upgrade' ? 'UPGRADED NODES (VERIFIED)' : 'ACTIVE NODES'}
                             </h3>
                             <div className="max-h-[400px] overflow-y-auto pr-2 space-y-2">
                                {displayedUsers.length === 0 && <p className="text-gray-600 text-sm p-4 text-center">No contributors found.</p>}
                                {displayedUsers.map(u => (
                                    <div key={u.id} className="flex justify-between items-center bg-gray-900 p-4 rounded border border-gray-800">
                                        <div className="flex items-center gap-3">
                                            {/* Avatar */}
                                            <img src={u.avatar} className="w-8 h-8 rounded-full border border-gray-700 object-cover bg-black" alt="avatar" />
                                            
                                            <div>
                                                <p className={`font-mono text-xs mb-1 ${u.isUpgraded ? 'text-yellow-500 font-bold' : 'text-gray-500'}`}>
                                                    {u.isUpgraded ? '★ UPGRADED' : u.username}
                                                </p>
                                                <p className="font-bold text-xs text-gray-400 break-all truncate max-w-[120px]">{u.id}</p>
                                            </div>
                                        </div>
                                        
                                        {/* HTML FIX: Link wraps a div, NOT a button */}
                                        <Link href={`/u/${u.id}`}>
                                            <div className={`px-3 py-1 text-xs font-bold rounded flex items-center gap-1 transition cursor-pointer ${u.isUpgraded ? 'bg-yellow-500 text-black hover:bg-yellow-400' : 'bg-gray-800 text-white hover:bg-gray-700'}`}>
                                                INSPECT 🔍
                                            </div>
                                        </Link>
                                    </div>
                                ))}
                             </div>
                        </div>

                    </div>
                  </div>
                )}

                {(user || isConnected) && (
                <div className="text-center mt-12 pb-10">
                    <Link href={`/u/${user ? user.id : address}`} className="inline-flex items-center gap-2 text-gray-400 hover:text-green-500 transition border-b border-transparent hover:border-green-500 pb-1">
                    View My Public Portfolio &rarr;
                    </Link>
                </div>
                )}
            </>
        )}
      </main>
    </div>
  );
}