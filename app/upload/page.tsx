"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { UploadCloud, Loader2, ArrowLeft, MessageSquare, Palette, Smile, Link as LinkIcon, Lock, Unlock } from "lucide-react";
import Link from "next/link";
import { useAccount } from 'wagmi'; 
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function UploadPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount(); 
  const [user, setUser] = useState<any>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [desc, setDesc] = useState("");
  const [msgLink, setMsgLink] = useState("");
  const [type, setType] = useState("chat");
  
  // --- 🔥 CRITICAL FIXES ---
  const [isEncrypted, setIsEncrypted] = useState(true); // Default: TRUE (Private)
  const [loading, setLoading] = useState(false);        // Default: FALSE (Fixes infinite loading)

  useEffect(() => {
    const getUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setUser(user);
    };
    getUser();
  }, []);

  const handleUpload = async () => {
    // 1. Auth Check
    if (!user && !isConnected) {
      alert("Please Connect Discord OR Wallet to upload!");
      return;
    }
    // 2. File Check
    if (!file) {
      alert("Please select a file!");
      return;
    }

    setLoading(true);
    try {
      const fileName = `${Date.now()}-${file.name.replace(/\s/g, '')}`;
      
      // 3. Upload Image
      const { error: uploadError } = await supabase.storage
        .from("uploads")
        .upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("uploads")
        .getPublicUrl(fileName);

      // 4. Save to Database (With Encryption Flag)
      const payload = {
            user_id: user ? user.id : null, 
            discord_id: user ? user.user_metadata.provider_id : null,
            wallet_address: address || "Discord-User", 
            content_type: type,
            description: desc,
            image_url: publicUrl,
            message_link: msgLink || null,
            is_encrypted: isEncrypted, // <--- YE ZAROORI HAI
      };

      const { error: dbError } = await supabase.from("archives").insert([payload]);

      if (dbError) throw dbError;

      alert(isEncrypted ? "Artifact Encrypted & Stored! 🔒" : "Artifact Published! 🌍");
      
      const redirectId = user ? user.id : address;
      router.push(`/u/${redirectId}`);

    } catch (error: any) {
      console.error(error);
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono p-8 flex justify-center items-center">
      <div className="max-w-xl w-full bg-gray-900/50 border border-gray-800 p-8 rounded-2xl">
        <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-white mb-6 transition"><ArrowLeft size={16} /> Back to Vault</Link>
        <h1 className="text-3xl font-bold mb-6">Archive Artifact 📂</h1>
        
        {!user && !isConnected && (
            <div className="bg-red-500/10 border border-red-900 p-4 rounded-xl mb-6 text-center">
                <p className="text-red-400 text-sm mb-3">Authentication Required</p>
                <div className="flex justify-center"><ConnectButton /></div>
            </div>
        )}

        <div className="space-y-6">
            {/* FILE INPUT */}
            <div>
                <label className="block text-gray-400 mb-2 text-sm">Upload Evidence</label>
                <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-green-900/20 file:text-green-500 border border-gray-700 rounded-lg p-2" />
            </div>

            {/* --- VISIBILITY TOGGLE (YE MISSING THA) --- */}
            <div className="bg-black border border-gray-800 p-4 rounded-xl flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        {isEncrypted ? <Lock size={16} className="text-green-500" /> : <Unlock size={16} className="text-gray-500" />}
                        Visibility Mode
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                        {isEncrypted ? "Secure: Only Owner & Admins can see." : "Public: Visible to everyone."}
                    </p>
                </div>
                <button 
                    onClick={() => setIsEncrypted(!isEncrypted)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition ${isEncrypted ? "bg-green-900/30 text-green-500 border border-green-500" : "bg-gray-800 text-gray-400"}`}
                >
                    {isEncrypted ? "ENCRYPTED 🔒" : "PUBLIC 🔓"}
                </button>
            </div>

            {/* CATEGORY */}
            <div>
                <label className="block text-gray-400 mb-3 text-sm">Category</label>
                <div className="grid grid-cols-3 gap-4">
                    <button onClick={() => setType("chat")} className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition ${type === "chat" ? "bg-green-600 border-green-500 text-black" : "bg-black border-gray-700 text-gray-400 hover:border-gray-500"}`}>
                        <MessageSquare size={24} /> <span className="text-xs font-bold">CHAT LOG</span>
                    </button>
                    <button onClick={() => setType("art")} className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition ${type === "art" ? "bg-purple-600 border-purple-500 text-white" : "bg-black border-gray-700 text-gray-400 hover:border-gray-500"}`}>
                        <Palette size={24} /> <span className="text-xs font-bold">ARTWORK</span>
                    </button>
                    <button onClick={() => setType("meme")} className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition ${type === "meme" ? "bg-yellow-500 border-yellow-400 text-black" : "bg-black border-gray-700 text-gray-400 hover:border-gray-500"}`}>
                        <Smile size={24} /> <span className="text-xs font-bold">MEME</span>
                    </button>
                </div>
            </div>

            {/* DESCRIPTION */}
            <textarea rows={2} placeholder="Description..." value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full bg-black border border-gray-700 rounded p-3 focus:border-green-500 outline-none" />

            {/* LINK */}
            <div>
                <label className="block text-gray-400 mb-2 text-sm flex items-center gap-2"><LinkIcon size={14} /> Discord Message Link (Optional)</label>
                <input type="text" placeholder="https://discord.com/channels/..." value={msgLink} onChange={(e) => setMsgLink(e.target.value)} className="w-full bg-black border border-gray-700 rounded p-3 focus:border-green-500 outline-none text-sm text-green-400" />
            </div>
            
            <button onClick={handleUpload} disabled={loading || (!user && !isConnected)} className="w-full bg-green-600 hover:bg-green-500 text-black font-bold py-4 rounded-xl flex justify-center items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? <Loader2 className="animate-spin" /> : <UploadCloud />} {loading ? "ENCRYPTING & UPLOADING..." : "ARCHIVE TO VAULT"}
            </button>
          </div>
      </div>
    </div>
  );
}