"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { Share2, ShieldCheck, MessageSquare, Palette, Smile, Grid, ExternalLink } from "lucide-react";
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
      const { data } = await supabase.from("archives").select("*").eq("user_id", params.id).order("created_at", { ascending: false });
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

  const filteredArtifacts = activeTab === "all" 
    ? artifacts 
    : artifacts.filter(item => item.content_type === activeTab);

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      <nav className="border-b border-green-900/50 p-6 flex justify-between items-center backdrop-blur-sm sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2">
          <ShieldCheck className="text-green-500 w-8 h-8" />
          <span className="text-2xl font-bold tracking-tighter">SEISMIC <span className="text-green-500">ARCHIVES</span></span>
        </Link>
        <button onClick={copyLink} className="bg-green-900/20 text-green-400 border border-green-900 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-900/40 transition text-sm font-bold">
          {copySuccess ? "COPIED! ✅" : <><Share2 size={16} /> SHARE PROFILE</>}
        </button>
      </nav>
      
      <main className="max-w-6xl mx-auto p-8 mt-4">
        
        {/* HEADER */}
        <div className="mb-8 text-center md:text-left">
            <h1 className="text-4xl font-bold mb-2 text-white">Proof of Contribution</h1>
            <p className="text-gray-400">Vault ID: <span className="text-green-500 font-mono">{params.id}</span></p>
        </div>

        {/* TABS */}
        <div className="flex flex-wrap gap-4 mb-10 border-b border-gray-800 pb-4">
            <button onClick={() => setActiveTab("all")} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition ${activeTab === "all" ? "bg-white text-black" : "bg-gray-900 text-gray-400 hover:text-white"}`}><Grid size={16} /> ALL</button>
            <button onClick={() => setActiveTab("chat")} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition ${activeTab === "chat" ? "bg-green-600 text-black" : "bg-gray-900 text-gray-400 hover:text-green-400"}`}><MessageSquare size={16} /> CHATS</button>
            <button onClick={() => setActiveTab("art")} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition ${activeTab === "art" ? "bg-purple-600 text-white" : "bg-gray-900 text-gray-400 hover:text-purple-400"}`}><Palette size={16} /> ARTS</button>
            <button onClick={() => setActiveTab("meme")} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition ${activeTab === "meme" ? "bg-yellow-500 text-black" : "bg-gray-900 text-gray-400 hover:text-yellow-400"}`}><Smile size={16} /> MEMES</button>
        </div>

        {/* GRID */}
        {loading ? <div className="text-center text-green-500 animate-pulse mt-20">Accessing Vault...</div> : filteredArtifacts.length === 0 ? <div className="text-center py-20 bg-gray-900/30 rounded-2xl border border-gray-800"><p className="text-gray-400">No records found.</p></div> : 
            <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                {filteredArtifacts.map((item) => (
                    <div key={item.id} className="break-inside-avoid bg-gray-900/40 border border-gray-800 rounded-xl overflow-hidden hover:border-green-500/50 transition duration-300">
                        <div className="relative">
                            <img src={item.image_url} className="w-full h-auto object-cover" />
                            <div className="absolute top-2 right-2 flex gap-1">
                                {item.content_type === 'chat' && <span className="bg-green-600 text-black text-xs font-bold px-2 py-1 rounded shadow">CHAT</span>}
                                {item.content_type === 'art' && <span className="bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded shadow">ART</span>}
                                {item.content_type === 'meme' && <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded shadow">MEME</span>}
                            </div>
                        </div>
                        <div className="p-4">
                            <p className="text-gray-300 text-sm mb-4">{item.description}</p>
                            
                            {/* --- VERIFY BUTTON --- */}
                            {item.message_link && (
                                <a 
                                    href={item.message_link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="block w-full text-center bg-gray-800 hover:bg-gray-700 border border-gray-700 text-green-400 text-xs font-bold py-2 rounded-lg transition flex items-center justify-center gap-2"
                                >
                                    <ExternalLink size={12} /> VERIFY ON DISCORD
                                </a>
                            )}
                            
                            <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between text-xs text-gray-500">
                                <span>{new Date(item.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        }
      </main>
    </div>
  );
}