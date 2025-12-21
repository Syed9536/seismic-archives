"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { Share2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function UserProfile() {
  const params = useParams();
  const [artifacts, setArtifacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      <nav className="border-b border-green-900/50 p-6 flex justify-between items-center backdrop-blur-sm sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2"><ShieldCheck className="text-green-500 w-8 h-8" /><span className="text-2xl font-bold tracking-tighter">SEISMIC <span className="text-green-500">ARCHIVES</span></span></Link>
        <button onClick={copyLink} className="bg-green-900/20 text-green-400 border border-green-900 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-900/40 transition">
          {copySuccess ? "COPIED! ✅" : <><Share2 size={16} /> SHARE PROFILE</>}
        </button>
      </nav>
      <main className="max-w-6xl mx-auto p-8 mt-4">
        <div className="mb-12 border-b border-gray-800 pb-8">
            <h1 className="text-4xl font-bold mb-2 text-white">Proof of Contribution</h1>
            <p className="text-gray-400">User ID: <span className="text-green-500 font-mono">{params.id}</span></p>
        </div>
        {loading ? <div className="text-center text-green-500 animate-pulse mt-20">Loading...</div> : artifacts.length === 0 ? <div className="text-center py-20 bg-gray-900/30 rounded-2xl border border-gray-800"><p className="text-gray-400">No artifacts yet.</p></div> : 
            <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                {artifacts.map((item) => (
                    <div key={item.id} className="break-inside-avoid bg-gray-900/40 border border-gray-800 rounded-xl overflow-hidden hover:border-green-500/50 transition">
                        <img src={item.image_url} className="w-full h-auto object-cover" />
                        <div className="p-4"><p className="text-gray-300 text-sm">{item.description}</p></div>
                    </div>
                ))}
            </div>
        }
      </main>
    </div>
  );
}