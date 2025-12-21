"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { Share2, ShieldCheck, MessageSquare, Palette, Smile, Grid, ExternalLink, Lock, Unlock } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function UserProfile() {
  const params = useParams();
  const [artifacts, setArtifacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); 
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
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
              ENCRYPTED VAULT
            </h1>
            <p className="text-gray-400">
              <span className="text-green-500 animate-pulse">●</span> Secure Connection: <span className="font-mono text-gray-500">{params.id}</span>
            </p>
        </div>

        {/* TABS */}
        <div className="flex flex-wrap gap-4 mb-10 border-b border-gray-800 pb-4">
            <button onClick={() => setActiveTab("all")} className={`flex items-center gap-2 px-4 py-2 rounded-none border-b-2 text-sm font-bold transition ${activeTab === "all" ? "border-green-500 text-green-500" : "border-transparent text-gray-600 hover:text-gray-400"}`}><Grid size={16} /> ALL_DATA</button>
            <button onClick={() => setActiveTab("chat")} className={`flex items-center gap-2 px-4 py-2 rounded-none border-b-2 text-sm font-bold transition ${activeTab === "chat" ? "border-green-500 text-green-500" : "border-transparent text-gray-600 hover:text-gray-400"}`}><MessageSquare size={16} /> COMM_LOGS</button>
            <button onClick={() => setActiveTab("art")} className={`flex items-center gap-2 px-4 py-2 rounded-none border-b-2 text-sm font-bold transition ${activeTab === "art" ? "border-green-500 text-green-500" : "border-transparent text-gray-600 hover:text-gray-400"}`}><Palette size={16} /> VISUALS</button>
            <button onClick={() => setActiveTab("meme")} className={`flex items-center gap-2 px-4 py-2 rounded-none border-b-2 text-sm font-bold transition ${activeTab === "meme" ? "border-green-500 text-green-500" : "border-transparent text-gray-600 hover:text-gray-400"}`}><Smile size={16} /> MEMETICS</button>
        </div>

        {/* GRID */}
        {loading ? (
            <div className="flex flex-col items-center justify-center mt-20 space-y-4">
                <div className="w-16 h-16 border-4 border-green-900 border-t-green-500 rounded-full animate-spin"></div>
                <p className="text-green-500 font-mono text-sm animate-pulse">DECRYPTING BLOCKS...</p>
            </div>
        ) : filteredArtifacts.length === 0 ? (
            <div className="text-center py-20 bg-gray-900/20 border border-gray-800 border-dashed rounded-none">
                <p className="text-gray-600 font-mono">No encrypted shards found.</p>
            </div>
        ) : (
            <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                {filteredArtifacts.map((item) => (
                    <EncryptedCard key={item.id} item={item} />
                ))}
            </div>
        )}
      </main>
    </div>
  );
}

// --- NEW COMPONENT: SEISMIC STYLE CARD ---
function EncryptedCard({ item }: { item: any }) {
    const [decrypted, setDecrypted] = useState(false);

    return (
        <div 
            className="break-inside-avoid bg-black border border-green-900/30 overflow-hidden hover:border-green-500 transition-all duration-300 group relative"
            onMouseEnter={() => setDecrypted(true)}
            onMouseLeave={() => setDecrypted(false)}
        >
            {/* Image Container with "Encryption" Effect */}
            <div className="relative overflow-hidden bg-gray-900 min-h-[200px]">
                <img 
                    src={item.image_url} 
                    className={`w-full h-auto object-cover transition-all duration-700 ease-in-out ${decrypted ? 'filter-none scale-105 opacity-100' : 'blur-md grayscale opacity-50 scale-100'}`} 
                />
                
                {/* Overlay Text when Encrypted */}
                {!decrypted && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 backdrop-blur-sm z-10">
                        <Lock className="text-green-500/50 mb-2 w-8 h-8" />
                        <span className="text-green-500/50 text-xs font-mono tracking-[0.2em] animate-pulse">ENCRYPTED</span>
                    </div>
                )}

                 {/* Unlock Icon on Reveal */}
                 {decrypted && (
                    <div className="absolute top-2 right-2 z-20 transition-opacity duration-300">
                        <Unlock className="text-green-400 w-4 h-4" />
                    </div>
                )}

                <div className="absolute top-2 left-2 z-20">
                    <span className="bg-black/80 text-green-500 text-[10px] font-bold px-2 py-1 border border-green-900 uppercase tracking-wider">
                        {item.content_type}
                    </span>
                </div>
            </div>

            <div className="p-4 border-t border-green-900/30 bg-gray-900/10">
                <p className={`text-sm mb-4 font-mono transition-colors ${decrypted ? 'text-gray-200' : 'text-gray-600 blur-[2px]'}`}>
                    {item.description}
                </p>
                
                {item.message_link && (
                    <a href={item.message_link} target="_blank" rel="noopener noreferrer" className="block w-full text-center bg-green-900/10 hover:bg-green-500 text-green-600 hover:text-black border border-green-900/50 hover:border-green-500 text-xs font-bold py-2 transition flex items-center justify-center gap-2 uppercase tracking-wide">
                        <ExternalLink size={12} /> Verify Source
                    </a>
                )}
                
                <div className="mt-4 pt-2 border-t border-green-900/20 flex justify-between text-[10px] text-gray-600 font-mono">
                    <span>HASH: {item.id.slice(0, 8)}...</span>
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
            </div>
        </div>
    );
}