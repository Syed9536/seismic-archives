"use client";

import { supabase } from "@/utils/supabase/client";
import { useState, useEffect } from "react";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Ghost, UploadCloud, ShieldCheck, Disc, LogOut, User, Loader2 } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const handleAuth = async () => {
      setAuthLoading(true);

      // --- STEP 1: KYA URL MEIN TOKEN HAI? (MANUAL CHECK) ---
      // Hum khud hash parsing karenge
      const hash = window.location.hash;
      
      if (hash && hash.includes("access_token")) {
        console.log("🔓 Token Found in URL! Manually setting session...");
        
        // Hash se access_token aur refresh_token nikaalo
        const params = new URLSearchParams(hash.substring(1)); // '#' hata ke parse karo
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (accessToken) {
          // Supabase ko FORCE karo login karne ke liye
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || "",
          });

          if (!error && data.session) {
            console.log("✅ Manual Login Success:", data.session.user.email);
            setUser(data.session.user);
            setAuthLoading(false);
            // URL saaf karo
            window.history.replaceState(null, '', window.location.pathname);
            return; // Kaam ho gaya, wapas jao
          }
        }
      }

      // --- STEP 2: AGAR URL MEIN KUCH NAHI, TOH STORAGE CHECK KARO ---
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log("💾 Session Found in Storage:", session.user.email);
        setUser(session.user);
      } else {
        console.log("❌ No Active Session");
      }
      
      setAuthLoading(false);
    };

    handleAuth();

    // --- STEP 3: LISTENER FOR LOGOUT/LOGIN ---
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setUser(session.user);
        setAuthLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setAuthLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleDiscordLogin = async () => {
    setAuthLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: { 
        redirectTo: window.location.origin 
      },
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
        <div className="text-center space-y-6 mb-20">
          <h1 className="text-5xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-600">
            {user ? "ACCESS" : "PROOF OF"} <br /> 
            <span className="text-green-500">{user ? "GRANTED" : "CONTRIBUTION"}</span>
          </h1>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto">
            {user 
              ? `Welcome back, ${user.user_metadata.full_name}.` 
              : "The decentralized vault for Seismic Community artifacts."}
          </p>
        </div>

        {/* CARDS */}
        <div className="grid md:grid-cols-2 gap-8">
          
          {/* LOGIC CARD */}
          {authLoading ? (
             <div className="border border-green-500/30 bg-green-900/10 p-10 rounded-2xl flex flex-col items-center justify-center h-full min-h-[300px] animate-pulse">
                <Loader2 className="animate-spin text-green-400 w-16 h-16 mb-6" />
                <h3 className="text-xl font-bold text-white">Verifying Identity...</h3>
                <p className="text-green-400/70 text-sm mt-2">Processing Token...</p>
             </div>
          ) : !user ? (
            <div onClick={handleDiscordLogin} className="group border border-gray-800 bg-gray-900/40 p-10 rounded-2xl hover:border-indigo-500/50 transition-all cursor-pointer relative overflow-hidden h-full">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Disc size={100} /></div>
              <div className="bg-indigo-500/10 w-fit p-3 rounded-xl mb-6"><Ghost className="text-indigo-400 w-8 h-8" /></div>
              <h3 className="text-2xl font-bold mb-2 group-hover:text-indigo-400 transition-colors">Sync Discord</h3>
              <p className="text-gray-400 mb-6">Link your Discord identity.</p>
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

          {/* UPLOAD CARD */}
          <Link href="/upload">
            <div className="group border border-gray-800 bg-gray-900/40 p-10 rounded-2xl hover:border-green-500/50 transition-all cursor-pointer relative overflow-hidden h-full flex flex-col justify-between">
              <div>
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><UploadCloud size={100} /></div>
                <div className="bg-green-500/10 w-fit p-3 rounded-xl mb-6"><UploadCloud className="text-green-400 w-8 h-8" /></div>
                <h3 className="text-2xl font-bold mb-2 group-hover:text-green-400 transition-colors">Manual Upload</h3>
                <p className="text-gray-400 mb-6">Upload your best work.</p>
              </div>
              <span className="text-green-400 text-sm font-bold flex items-center gap-2">START UPLOAD &rarr;</span>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}