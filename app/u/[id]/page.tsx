"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { useAccount } from 'wagmi'; 
import { Share2, ShieldCheck, MessageSquare, Palette, Smile, Grid, ExternalLink, Lock, Eye, EyeOff, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

// --- 🔐 ACCESS CONTROL CONFIGURATION ---
// Yahan Seismic Team ke Wallet Addresses aayenge (Lowercase mein)
const SEISMIC_ADMINS = [
    "0x6FE125B9c4617dcceeFeB841cE8761b79FAC8280", // <--- Apna Address daal test karne ke liye
    "0x1234567890abcdef1234567890abcdef12345678", // Admin 1
    "0xabcdef1234567890abcdef1234567890abcdef12", // Admin 2
].map(addr => addr.toLowerCase());

export default function UserProfile() {
  const params = useParams();
  const { address } = useAccount(); // Viewer ka Wallet
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [artifacts, setArtifacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); 
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);
    };
    checkUser();

    const fetchArtifacts = async () => {
      const id = params.id as string;
      let query = supabase.from("archives").select("*").order("created_at", { ascending: false });

      if (id.startsWith("0x")) {
        query = query.eq("wallet_address", id);
      } else {
        query = query.eq("user_id", id);
      }

      const { data } = await query;
      if (data) setArtifacts(data);
      setLoading(false);
    };
    
    if (params.id) fetchArtifacts();
  }, [params.id]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // --- 🧠 CORE PERMISSION LOGIC ---
  
  // 1. Check if Viewer is Owner
  const isOwner = (address && address.toLowerCase() === (params.id as string).toLowerCase()) || 
                  (currentUser && currentUser.id === params.id);

  // 2. Check if Viewer is Admin (Seismic Team)
  const isAdmin = address && SEISMIC_ADMINS.includes(address.toLowerCase());

  // 3. Final Access Decision
  const hasAccess = isOwner || isAdmin;

  const filteredArtifacts = activeTab === "all" ? artifacts : artifacts.filter(item => item.content_type === activeTab);

  return (
    <div className="min-h-screen bg-black text-white font-mono selection:bg-green-500 selection:text-black">
      
      <nav className="border-b border-green-900/50 p-6 flex justify-between items-center backdrop-blur-sm sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2">
          <ShieldCheck className="text-green-500 w-8 h-8" />
          <span className="text-2xl font-bold tracking-tighter">SEISMIC <span className="text-green-500">ARCHIVES</span></span>
        </Link>
        <button onClick={copyLink} className="bg-green-900/20 text-green-400 border border-green-900 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-900/40 transition text-sm font-bold">
          {copySuccess ? "COPIED! ✅" : <><Share2 size={16} /> SHARE IDENTITY</>}
        </button>
      </nav>
      
      <main className="max-w-6xl mx-auto p-8 mt-4">
        <div className="mb-8 text-center md:text-left">
            <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
              SEISMIC LEDGER
            </h1>
            <p className="text-gray-400">
              <span className="text-green-500 animate-pulse">●</span> Node ID: <span className="font-mono text-gray-500">{params.id}</span>
            </p>
            
            {/* ACCESS STATUS BADGES */}
            <div className="mt-4 flex gap-2 justify-center md:justify-start">
                {isOwner && (
                    <span className="text-xs font-bold text-black bg-green-500 px-3 py-1 rounded flex items-center gap-1">
                        <Eye size={12} /> OWNER ACCESS
                    </span>
                )}
                {isAdmin && !isOwner && (
                    <span className="text-xs font-bold text-white bg-indigo-600 px-3 py-1 rounded flex items-center gap-1 shadow-[0_0_15px_rgba(79,70,229,0.5)]">
                        <ShieldAlert size={12} /> SEISMIC AUDITOR VIEW
                    </span>
                )}
            </div>
        </div>

        {/* TABS */}
        <div className="flex flex-wrap gap-4 mb-10 border-b border-gray-800 pb-4">
            <button onClick={() => setActiveTab("all")} className={`flex items-center gap-2 px-4 py-2 rounded-none border-b-2 text-sm font-bold transition ${activeTab === "all" ? "border-green-500 text-green-500" : "border-transparent text-gray-600 hover:text-gray-400"}`}><Grid size={16} /> ALL_BLOCKS</button>
            <button onClick={() => setActiveTab("chat")} className={`flex items-center gap-2 px-4 py-2 rounded-none border-b-2 text-sm font-bold transition ${activeTab === "chat" ? "border-green-500 text-green-500" : "border-transparent text-gray-600 hover:text-gray-400"}`}><MessageSquare size={16} /> LOGS</button>
            <button onClick={() => setActiveTab("art")} className={`flex items-center gap-2 px-4 py-2 rounded-none border-b-2 text-sm font-bold transition ${activeTab === "art" ? "border-green-500 text-green-500" : "border-transparent text-gray-600 hover:text-gray-400"}`}><Palette size={16} /> VISUALS</button>
        </div>

        {/* GRID */}
        {loading ? (
            <div className="flex flex-col items-center justify-center mt-20 space-y-4">
                <div className="w-16 h-16 border-4 border-green-900 border-t-green-500 rounded-full animate-spin"></div>
                <p className="text-green-500 font-mono text-sm animate-pulse">SYNCING CHAIN...</p>
            </div>
        ) : filteredArtifacts.length === 0 ? (
            <div className="text-center py-20 bg-gray-900/20 border border-gray-800 border-dashed rounded-none">
                <p className="text-gray-600 font-mono">No blocks found.</p>
            </div>
        ) : (
            <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                {filteredArtifacts.map((item) => (
                    
                    // --- ACCESS LOGIC: Show Content IF (Not Encrypted) OR (User Has Access) ---
                    (!item.is_encrypted || hasAccess) ? (
                        // 🔓 UNLOCKED CARD (Visible to Public OR Admin/Owner)
                        <div key={item.id} className={`break-inside-avoid bg-black border overflow-hidden transition-all duration-300 ${item.is_encrypted ? "border-indigo-500/50 shadow-[0_0_20px_rgba(79,70,229,0.1)]" : "border-green-900/30 hover:border-green-500"}`}>
                             <div className="relative">
                                <img src={item.image_url} className="w-full h-auto object-cover" />
                                
                                {/* Badge for Encrypted Items visible to Admin/Owner */}
                                {item.is_encrypted && (
                                    <div className="absolute top-2 right-2 bg-indigo-600 text-white text-[10px] px-2 py-1 flex items-center gap-1 font-bold shadow-lg">
                                        <Eye size={10} /> DECRYPTED
                                    </div>
                                )}
                             </div>
                             <div className="p-4 bg-gray-900/10 border-t border-green-900/30">
                                <p className="text-sm text-gray-300 mb-4 font-mono">{item.description}</p>
                                {item.message_link && (
                                    <a href={item.message_link} target="_blank" rel="noopener noreferrer" className="block w-full text-center bg-green-900/10 hover:bg-green-500 text-green-600 hover:text-black border border-green-900/50 hover:border-green-500 text-xs font-bold py-2 transition flex items-center justify-center gap-2 uppercase tracking-wide">
                                        <ExternalLink size={12} /> Verify Source
                                    </a>
                                )}
                                <div className="mt-4 pt-2 border-t border-green-900/20 text-[10px] text-gray-600 font-mono flex justify-between">
                                    <span>TYPE: {item.content_type.toUpperCase()}</span>
                                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                                </div>
                             </div>
                        </div>
                    ) : (
                        // 🔒 LOCKED CARD (Visible ONLY to Public when Encrypted)
                        <div key={item.id} className="break-inside-avoid bg-black border border-gray-800 p-6 flex flex-col items-center justify-center min-h-[250px] relative overflow-hidden group">
                            {/* Matrix Effect Background */}
                            <div className="absolute inset-0 bg-[url('https://media.giphy.com/media/U3qYN8S0j3bpK/giphy.gif')] opacity-5 grayscale bg-cover"></div>
                            
                            <Lock size={40} className="text-gray-600 mb-4 group-hover:text-green-500 transition-colors" />
                            <h3 className="text-gray-500 font-bold font-mono tracking-widest group-hover:text-green-500 transition-colors">ENCRYPTED BLOCK</h3>
                            <p className="text-xs text-gray-700 mt-2 text-center">Content visible to Owner & Auditors only.</p>
                            
                            <div className="mt-6 w-full border-t border-gray-800 pt-4">
                                <p className="text-[10px] text-gray-600 font-mono mb-1">PROOF HASH:</p>
                                <p className="text-[10px] text-green-900 break-all font-mono bg-black p-2 border border-gray-900 rounded">{item.id}</p>
                                <p className="text-[10px] text-gray-600 mt-2 text-right">{new Date(item.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                    )
                ))}
            </div>
        )}
      </main>
    </div>
  );
}