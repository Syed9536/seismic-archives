"use client";

import { supabase } from "@/utils/supabase/client";
import { useState, useEffect } from "react";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi'; 
import { checkIsAdmin } from "@/utils/admins"; 
import { Ghost, UploadCloud, ShieldCheck, Disc, LogOut, User, Loader2, ShieldAlert, LayoutDashboard, Lock } from "lucide-react"; // Lock icon add kiya
import Link from "next/link";

export default function Home() {
  const { address, isConnected } = useAccount(); 
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false); 

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

  // --- 2. ADMIN CHECKER ---
  useEffect(() => {
    const discordId = user?.user_metadata?.provider_id || user?.identities?.find((id: any) => id.provider === 'discord')?.id;
    const adminStatus = checkIsAdmin(address, discordId);
    setIsAdmin(adminStatus || false);
  }, [user, address]);


  // --- 3. REDIRECT FIX (GLITCH FIX HERE) ---
  // Bhai maine isko comment kar diya hai. Ye code hi auto-redirect kar raha tha.
  /*
  useEffect(() => {
    if (user) {
        const returnUrl = localStorage.getItem('seismic_return_url');
        if (returnUrl) {
            localStorage.removeItem('seismic_return_url'); 
            window.location.href = returnUrl; 
        }
    }
  }, [user]);
  */


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
                <div className="flex flex-col md:flex-row gap-6 items-stretch justify-center">
                    
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

                    {/* RIGHT: MANUAL UPLOAD - FIXED (ONLY CLICKABLE IF VERIFIED) */}
                    <div className="flex-1 w-full">
                        {user ? (
                            // Agar User Verified hai to ye dikhega (Clickable)
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
                            // Agar User Verified NAHI hai to ye dikhega (Locked)
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

                {/* FOOTER */}
                {(user || isConnected) && (
                <div className="text-center mt-12">
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