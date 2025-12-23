"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { useAccount } from 'wagmi'; 
import { ConnectButton } from '@rainbow-me/rainbowkit'; 
import { checkIsAdmin } from "@/utils/admins"; 
import { Share2, ShieldCheck, ExternalLink, Lock, Eye, ShieldAlert, Disc, Loader2, Trash2, CheckCircle, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function UserProfile() {
  const params = useParams();
  const { address } = useAccount(); 
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [artifacts, setArtifacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); 
  const [copySuccess, setCopySuccess] = useState(false);

  // --- 1. AUTH & DATA FETCHING ---
  useEffect(() => {
    const init = async () => {
        const hash = window.location.hash;
        if (hash && hash.includes("access_token")) {
            const params = new URLSearchParams(hash.substring(1));
            const accessToken = params.get("access_token");
            if (accessToken) {
                const { data } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: params.get("refresh_token") || "",
                });
                if (data.session) {
                    setCurrentUser(data.session.user);
                    window.history.replaceState(null, '', window.location.pathname);
                }
            }
        } else {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setCurrentUser(user);
        }

        // FETCH DATA
        const id = params.id as string;
        let query = supabase.from("archives").select("*").order("created_at", { ascending: false });

        if (id.startsWith("0x")) {
             // 1. Pehle Wallet Address se try karo
             const { data: walletData } = await supabase
                .from("archives")
                .select("*")
                .eq("wallet_address", id) 
                .order("created_at", { ascending: false });
             
             if (walletData && walletData.length > 0) {
                 setArtifacts(walletData);
                 setLoading(false);
                 return;
             }
             
             // 2. Agar khali mila, to user_id se try karo (kisi ne agar user_id me wallet daal diya ho galti se)
             // Note: UUID column me 0x daalne se error ata hai, isliye ye risk hai, par try kar rahe hain
             // Behtar hai hum empty return karein agar wallet match nahi hua
             console.log("No data found for wallet, checking user_id fallback skipped to avoid UUID error.");
             setArtifacts([]);
             setLoading(false);
        } else {
            // Normal User ID (UUID)
            query = query.eq("user_id", id);
            const { data } = await query;
            if (data) setArtifacts(data);
            setLoading(false);
        }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (session) setCurrentUser(session.user);
    });

    return () => subscription.unsubscribe();
  }, [params.id]);

  // --- 2. ADMIN CHECKER ---
  useEffect(() => {
      const getDiscordId = (user: any) => {
          if (!user) return null;
          const discordIdentity = user.identities?.find((id: any) => id.provider === 'discord');
          if (discordIdentity) return discordIdentity.id;
          return user.user_metadata?.provider_id;
      };
      const discordId = getDiscordId(currentUser);
      const status = checkIsAdmin(address, discordId);
      setIsAdmin(status || false);
  }, [address, currentUser]);

  // --- 3. ACTIONS ---
  
  // A. DELETE FUNCTION (RLS OFF kar diya hai to ab chalega)
  const deleteItem = async (artifactId: string, filePath: string) => {
    if(!confirm("⚠️ DELETE PERMANENTLY?")) return;
    
    // Optimistic Update
    const prevArtifacts = [...artifacts];
    setArtifacts(prev => prev.filter(item => item.id !== artifactId));

    try {
        if(filePath) {
             await supabase.storage.from('artifacts').remove([filePath]);
        }
        
        const { error } = await supabase.from('archives').delete().eq('id', artifactId);
        
        if (error) throw error;

    } catch (error: any) {
        console.error("Delete Failed:", error);
        alert("Delete Failed: " + error.message);
        setArtifacts(prevArtifacts);
    }
  };

  // B. UPGRADE USER FUNCTION (With Count Check)
  const verifyUserForUpgrade = async () => {
    if(!confirm("Mark this node for ROLE UPGRADE?")) return;

    const id = params.id as string;
    let success = false;
    let message = "";

    // TRY 1: WALLET ADDRESS UPDATE
    if (id.startsWith("0x")) {
        // Hum select count use kar rahe hain taaki pata chale sach me update hua ya nahi
        const { error, count } = await supabase
            .from('archives')
            .update({ status: 'verified' }, { count: 'exact' }) // Count maanga
            .eq('wallet_address', id)
            .select(); // Select zaroori hai count return karne ke liye

        if (error) {
            message = "Wallet Update Error: " + error.message;
        } else if (count === 0) {
            // Agar 0 update hue, matlab wallet address match nahi hua
            message = "⚠️ No artifacts found with this Wallet Address. Check if DB has correct 'wallet_address'.";
        } else {
            success = true;
            message = `✅ SUCCESS: Updated ${count} artifacts! Node marked for Upgrade.`;
        }
    } 
    // TRY 2: USER ID UPDATE
    else {
        const { error, count } = await supabase
            .from('archives')
            .update({ status: 'verified' }, { count: 'exact' })
            .eq('user_id', id)
            .select();

        if (error) {
            message = "User ID Update Error: " + error.message;
        } else if (count === 0) {
            message = "⚠️ No artifacts found for this User ID.";
        } else {
            success = true;
            message = `✅ SUCCESS: Updated ${count} artifacts! Node marked for Upgrade.`;
        }
    }

    alert(message);
    
    if(success) {
        setArtifacts(prev => prev.map(a => ({...a, status: 'verified'})));
    }
  };

  // --- HELPERS ---
  const handleDiscordLogin = async () => {
    localStorage.setItem('seismic_return_url', window.location.pathname);
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: { redirectTo: window.location.origin }, 
    });
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const isOwner = (address && address.toLowerCase() === (params.id as string).toLowerCase()) || 
                  (currentUser && currentUser.id === params.id);
  const hasAccess = isOwner || isAdmin;
  const isLoggedIn = address || currentUser;
  const filteredArtifacts = activeTab === "all" ? artifacts : artifacts.filter(item => item.content_type === activeTab);

  return (
    <div className="min-h-screen bg-black text-white font-mono selection:bg-green-500 selection:text-black">
      <nav className="border-b border-green-900/50 p-6 flex flex-col md:flex-row justify-between items-center backdrop-blur-sm sticky top-0 z-50 gap-4">
        <Link href="/" className="flex items-center gap-2">
          <ShieldCheck className="text-green-500 w-8 h-8" />
          <span className="text-2xl font-bold tracking-tighter">SEISMIC <span className="text-green-500">ARCHIVES</span></span>
        </Link>
        <div className="flex items-center gap-4">
             {!isLoggedIn && (
                <div className="flex items-center gap-2 bg-gray-900/50 p-1 rounded-xl border border-gray-800">
                    <ConnectButton showBalance={false} accountStatus="avatar" chainStatus="none" />
                    <button onClick={handleDiscordLogin} className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-lg font-bold text-xs flex items-center gap-2 transition">
                        <Disc size={16} /> ADMIN SYNC
                    </button>
                </div>
             )}
             {isAdmin && (
                <span className="hidden md:flex items-center gap-2 text-xs font-bold bg-red-900/20 text-red-500 border border-red-900 px-3 py-2 rounded animate-pulse">
                    <ShieldAlert size={14} /> AUDITOR ACTIVE
                </span>
             )}
            <button onClick={copyLink} className="bg-green-900/20 text-green-400 border border-green-900 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-900/40 transition text-sm font-bold h-[40px]">
                {copySuccess ? "COPIED! ✅" : <><Share2 size={16} /> SHARE</>}
            </button>
        </div>
      </nav>
      
      <main className="max-w-6xl mx-auto p-8 mt-4">
        <div className="mb-8 text-center md:text-left flex flex-col md:flex-row justify-between items-end border-b border-gray-800 pb-6">
            <div>
                <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">SEISMIC LEDGER</h1>
                <p className="text-gray-400">
                <span className="text-green-500 animate-pulse">●</span> Node ID: <span className="font-mono text-gray-500">{params.id}</span>
                </p>
                <div className="mt-4 flex flex-col md:flex-row gap-2 justify-center md:justify-start">
                    {!isLoggedIn && <span className="text-xs font-bold text-gray-500 bg-gray-900 px-3 py-1 rounded flex items-center gap-1 border border-gray-800"><Lock size={12} /> ENCRYPTED VIEW</span>}
                    {isAdmin && <span className="text-xs font-bold text-white bg-red-600 px-3 py-1 rounded flex items-center gap-1 shadow-[0_0_15px_rgba(220,38,38,0.5)]"><ShieldAlert size={12} /> ADMIN OVERRIDE</span>}
                    {isOwner && <span className="text-xs font-bold text-black bg-green-500 px-3 py-1 rounded flex items-center gap-1"><Eye size={12} /> OWNER ACCESS</span>}
                </div>
            </div>
            {isAdmin && (
                <button onClick={verifyUserForUpgrade} className="mt-4 md:mt-0 bg-yellow-500 text-black border border-yellow-500/50 px-6 py-3 rounded-lg text-sm font-bold flex items-center gap-2 transition hover:bg-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.4)]">
                  <ArrowUpRight size={20}/> MARK NODE FOR UPGRADE
                </button>
            )}
        </div>

        {loading ? (
            <div className="flex flex-col items-center justify-center mt-20 space-y-4">
                <Loader2 className="w-16 h-16 text-green-500 animate-spin" />
                <p className="text-green-500 font-mono text-sm animate-pulse">SYNCING CHAIN...</p>
            </div>
        ) : filteredArtifacts.length === 0 ? (
            <div className="text-center py-20 bg-gray-900/20 border border-gray-800 border-dashed rounded-none">
                <p className="text-gray-600 font-mono">No blocks found.</p>
            </div>
        ) : (
            <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                {filteredArtifacts.map((item) => (
                    (!item.is_encrypted || hasAccess) ? (
                        <div key={item.id} className={`break-inside-avoid bg-black border overflow-hidden relative group transition-all duration-300 ${item.is_encrypted ? "border-indigo-500/50" : "border-green-900/30 hover:border-green-500"}`}>
                             {isAdmin && (
                                <button onClick={() => deleteItem(item.id, item.file_path)} className="absolute top-3 left-3 z-50 bg-red-600 text-white p-2 rounded-full hover:bg-red-500 shadow-[0_0_10px_rgba(220,38,38,0.8)] border border-white/20" title="Delete Artifact">
                                    <Trash2 size={16} />
                                </button>
                             )}
                             <div className="relative">
                                <img src={item.image_url} className="w-full h-auto object-cover" />
                                {item.is_encrypted && <div className="absolute top-2 right-2 bg-indigo-600 text-white text-[10px] px-2 py-1 flex items-center gap-1 font-bold shadow-lg"><Eye size={10} /> DECRYPTED</div>}
                                {item.status === 'verified' && <div className="absolute bottom-2 right-2 bg-green-500 text-black text-[10px] px-2 py-1 flex items-center gap-1 font-bold shadow-lg rounded-full"><CheckCircle size={10} /> VERIFIED</div>}
                             </div>
                             <div className="p-4 bg-gray-900/10 border-t border-green-900/30">
                                <p className="text-sm text-gray-300 mb-4 font-mono">{item.description}</p>
                                {item.message_link && (
                                    <a href={item.message_link} target="_blank" rel="noopener noreferrer" className="block w-full text-center bg-green-900/10 hover:bg-green-500 text-green-600 hover:text-black border border-green-900/50 hover:border-green-500 text-xs font-bold py-2 transition flex items-center justify-center gap-2 uppercase tracking-wide">
                                        <ExternalLink size={12} /> Verify Source
                                    </a>
                                )}
                                <div className="mt-4 pt-2 border-t border-green-900/20 text-[10px] text-gray-600 font-mono flex justify-between">
                                    <span>TYPE: {item.content_type?.toUpperCase()}</span>
                                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                                </div>
                             </div>
                        </div>
                    ) : (
                        <div key={item.id} className="break-inside-avoid bg-black border border-gray-800 p-6 flex flex-col items-center justify-center min-h-[250px] relative overflow-hidden group">
                            <Lock size={40} className="text-gray-600 mb-4" />
                            <h3 className="text-gray-500 font-bold font-mono tracking-widest">ENCRYPTED BLOCK</h3>
                            <p className="text-xs text-gray-700 mt-2 text-center max-w-[200px]">Content hidden. <br/><span className="text-green-500">Connect Whitelisted Wallet/Discord above to decrypt.</span></p>
                        </div>
                    )
                ))}
            </div>
        )}
      </main>
    </div>
  );
}