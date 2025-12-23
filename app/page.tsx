"use client";

import { supabase } from "@/utils/supabase/client";
import { useState, useEffect } from "react";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi'; 
import { checkIsAdmin } from "@/utils/admins"; 
import { Ghost, UploadCloud, ShieldCheck, Disc, LogOut, User, Loader2, ShieldAlert, LayoutDashboard, Lock, Trash2, CheckCircle, XCircle } from "lucide-react"; // Added Icons
import Link from "next/link";

// --- ADMIN HELPER FUNCTIONS (Added here as requested) ---
const deleteArtifact = async (artifactId: string, filePath: string) => {
  try {
    const { error: storageError } = await supabase.storage.from('artifacts').remove([filePath]);
    if (storageError) throw storageError;
    const { error: dbError } = await supabase.from('artifacts').delete().eq('id', artifactId);
    if (dbError) throw dbError;
    return { success: true };
  } catch (error) {
    console.error("Delete failed:", error);
    return { success: false, error };
  }
};

const verifyArtifact = async (artifactId: string) => {
  const { error } = await supabase.from('artifacts').update({ status: 'verified' }).eq('id', artifactId);
  return { success: !error };
};

const markUserForUpgrade = async (userId: string) => {
   // Note: Client side admin update usually requires an Edge Function, but leaving logic here as requested.
   console.log("Marking user for upgrade:", userId);
};

export default function Home() {
  const { address, isConnected } = useAccount(); 
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false); 

  // --- NEW STATE FOR ADMIN DASHBOARD ---
  const [userArtifacts, setUserArtifacts] = useState<any[]>([]); // For Snippet 1
  const [users, setUsers] = useState<any[]>([]); // For Snippet 2
  const [activeTab, setActiveTab] = useState('all'); // For Snippet 2

  // --- 1. AUTH HANDLING ---
  useEffect(() => {
    const handleAuth = async () => {
      setAuthLoading(true);

      const hash = window.location.hash;
      if (hash && hash.includes("access_token")) {
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (accessToken) {
          const { data } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || "",
          });
          if (data.session) {
             setUser(data.session.user);
          }
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) setUser(session.user);
      
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

  // --- 2. ADMIN CHECKER & DATA FETCHING ---
  useEffect(() => {
    const discordId = user?.user_metadata?.provider_id || user?.identities?.find((id: any) => id.provider === 'discord')?.id;
    const adminStatus = checkIsAdmin(address, discordId);
    setIsAdmin(adminStatus || false);

    // Agar Admin hai to Data Fetch karo (Artifacts & Users)
    if (adminStatus) {
        const fetchAdminData = async () => {
            // 1. Fetch All Artifacts
            const { data: artifactsData } = await supabase.from('artifacts').select('*').order('created_at', { ascending: false });
            if (artifactsData) {
                setUserArtifacts(artifactsData);

                // 2. Generate User List from Artifacts (Grouping by user_id)
                // Ye logic 'artifacts' array se unique users nikalega taaki Snippet 2 kaam kare
                const groupedUsers = Object.values(artifactsData.reduce((acc: any, curr: any) => {
                    const uid = curr.user_id || 'unknown'; 
                    if(!acc[uid]) acc[uid] = { id: uid, artifacts: [] };
                    acc[uid].artifacts.push(curr);
                    return acc;
                }, {}));
                setUsers(groupedUsers);
            }
        };
        fetchAdminData();
    }
  }, [user, address]);

  const handleDiscordLogin = async () => {
    setAuthLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: { redirectTo: window.location.origin },
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // --- FILTER LOGIC FOR SNIPPET 2 ---
  const displayedUsers = users.filter(u => {
    if (activeTab === 'ready_for_upgrade') {
        return u.artifacts.some((a: any) => a.status === 'verified');
    }
    return true;
  });

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
                <button className="hidden md:flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-[0_0_15px_rgba(220,38,38,0.6)] animate-pulse transition">
                    <LayoutDashboard size={14} /> ADMIN PANEL
                </button>
            </Link>
          )}

          {user && (
            <div className="hidden md:flex items-center gap-2 text-xs text-green-400 border border-green-900 px-3 py-1 rounded-full bg-green-900/10">
               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
               {user.user_metadata.full_name?.split(" ")[0]}
            </div>
          )}
          <div className="shadow-[0_0_15px_rgba(34,197,94,0.3)] rounded-xl">
            <ConnectButton showBalance={false} accountStatus="address" chainStatus="icon"/>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
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
                    ? `Welcome back, ${user.user_metadata.full_name}.` 
                    : isConnected 
                        ? "Wallet Connected. You may verify with Discord for full access."
                        : "The decentralized vault for Seismic Community artifacts."}
                </p>
                </div>

                {/* MAIN CARDS */}
                <div className="flex flex-col md:flex-row gap-6 items-stretch justify-center mb-20">
                    
                    {/* LEFT: DISCORD CARD */}
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
                                <img src={user.user_metadata.avatar_url} className="w-20 h-20 rounded-full border-4 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.5)]" />
                                <div>
                                <h3 className="text-3xl font-bold text-white">{user.user_metadata.full_name}</h3>
                                <p className="text-green-400 text-sm font-mono tracking-wider">VERIFIED</p>
                                </div>
                            </div>
                            <div className="space-y-3 mb-8 bg-black/30 p-4 rounded-lg border border-green-900/30">
                                <p className="text-gray-400 text-sm">Discord Connected ✅</p>
                                <p className="text-gray-500 text-xs truncate">ID: {user.id}</p>
                            </div>
                            </div>
                            <button onClick={handleLogout} className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition border border-red-900/30"><LogOut size={16} /> DISCONNECT</button>
                        </div>
                        )}
                    </div>

                    {/* DIVIDER */}
                    <div className="flex items-center justify-center md:flex-col relative shrink-0">
                        <div className="absolute inset-0 flex items-center justify-center md:flex-col">
                        <div className="w-full h-px md:w-px md:h-full bg-gray-800"></div>
                        </div>
                        <div className="relative bg-black p-2">
                            <span className="text-gray-500 text-xs font-bold border border-gray-800 px-3 py-2 rounded-full bg-gray-900/50 shadow-xl">OR</span>
                        </div>
                    </div>

                    {/* RIGHT: MANUAL UPLOAD */}
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

                {/* 🔥 ADMIN CONTROL CENTER 🔥 
                   Ye Section sirf Admin ko dikhega (Added as per your snippets)
                */}
                {isAdmin && (
                  <div className="border-t border-red-900/50 pt-10 mt-10">
                    <h2 className="text-2xl font-black text-red-600 mb-6 flex items-center gap-2">
                        <ShieldAlert /> OVERWATCH CONTROLS
                    </h2>

                    {/* TABS (SNIPPET 2) */}
                    <div className="flex gap-4 mb-6">
                        <button onClick={() => setActiveTab('all')} className={`text-sm px-4 py-2 rounded transition ${activeTab === 'all' ? 'bg-gray-800 text-white' : 'text-gray-500'}`}>
                            All Contributors
                        </button>
                        <button onClick={() => setActiveTab('ready_for_upgrade')} className={`text-sm border border-green-500/30 px-4 py-2 rounded transition ${activeTab === 'ready_for_upgrade' ? 'bg-green-500/20 text-green-400' : 'text-gray-500 hover:text-green-400'}`}>
                            Ready for Upgrade 🎖️
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        
                        {/* LIST 1: INCOMING ARTIFACTS (SNIPPET 1) */}
                        <div className="bg-gray-950 p-6 rounded-xl border border-gray-800">
                            <h3 className="text-gray-400 font-bold mb-4 text-xs tracking-widest">INCOMING STREAM</h3>
                            <div className="max-h-[400px] overflow-y-auto pr-2">
                                {userArtifacts.length === 0 && <p className="text-gray-600 text-sm">No artifacts found.</p>}
                                {userArtifacts.map((item) => (
                                    <div key={item.id} className="flex justify-between items-center bg-gray-900 p-4 rounded mb-2 border border-gray-800">
                                        
                                        {/* File Info */}
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="text-white min-w-0">
                                                <p className="font-bold truncate max-w-[150px]">{item.filename}</p>
                                                <span className={`text-[10px] px-2 py-0.5 rounded ${
                                                    item.status === 'verified' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                                                }`}>
                                                    {item.status?.toUpperCase() || 'PENDING'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* ACTIONS */}
                                        <div className="flex gap-2 shrink-0">
                                            {/* DELETE BUTTON */}
                                            <button 
                                                onClick={async () => {
                                                    if(confirm("Are you sure? This is permanent.")) {
                                                        const res = await deleteArtifact(item.id, item.file_path);
                                                        if(res.success) {
                                                            setUserArtifacts(prev => prev.filter(a => a.id !== item.id));
                                                        }
                                                    }
                                                }}
                                                className="p-2 bg-red-900/20 hover:bg-red-900/50 text-red-500 rounded transition"
                                                title="Permanently Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>

                                            {/* VERIFY BUTTON */}
                                            {item.status !== 'verified' && (
                                                <button 
                                                    onClick={async () => {
                                                        const res = await verifyArtifact(item.id);
                                                        if(res.success) {
                                                            setUserArtifacts(prev => prev.map(a => a.id === item.id ? {...a, status: 'verified'} : a));
                                                            // Trigger re-render for users list too if needed
                                                        }
                                                    }}
                                                    className="p-2 bg-green-900/20 hover:bg-green-900/50 text-green-500 rounded transition"
                                                    title="Verify Contribution"
                                                >
                                                    <CheckCircle size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* LIST 2: USERS / CONTRIBUTORS (SNIPPET 2) */}
                        <div className="bg-gray-950 p-6 rounded-xl border border-gray-800">
                             <h3 className="text-gray-400 font-bold mb-4 text-xs tracking-widest">ACTIVE NODES</h3>
                             <div className="max-h-[400px] overflow-y-auto pr-2">
                                {displayedUsers.length === 0 && <p className="text-gray-600 text-sm">No contributors found.</p>}
                                {displayedUsers.map(u => (
                                    <div key={u.id} className="flex justify-between items-center bg-gray-900 p-4 rounded mb-2 border border-gray-800">
                                        <div>
                                            <p className="font-mono text-xs text-gray-400 break-all">{u.id}</p>
                                            <p className="text-xs text-gray-600 mt-1">{u.artifacts.length} Uploads</p>
                                        </div>
                                        
                                        {activeTab === 'ready_for_upgrade' && (
                                            <button 
                                                onClick={() => markUserForUpgrade(u.id)}
                                                className="bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/50 text-yellow-500 px-3 py-1 text-xs font-bold rounded flex items-center gap-1 transition"
                                            >
                                                GRANT ROLE 🔼
                                            </button>
                                        )}
                                    </div>
                                ))}
                             </div>
                        </div>

                    </div>
                  </div>
                )}

                {/* FOOTER */}
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