"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { UploadCloud, Loader2, ArrowLeft, MessageSquare, Palette, Smile, Link as LinkIcon, Lock, Unlock, UserCircle, ShieldCheck } from "lucide-react";
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
  const [isEncrypted, setIsEncrypted] = useState(true); 
  const [loading, setLoading] = useState(false);

  // --- IDENTITY STATES ---
  const [discordName, setDiscordName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    const getUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setUser(user);
            setDiscordName(user.user_metadata.full_name || "");
            setAvatarUrl(user.user_metadata.avatar_url || "");
        }
    };
    getUser();
  }, []);

  const handleUpload = async () => {
    if (!user && !isConnected) {
      alert("Please Connect Discord OR Wallet to upload!");
      return;
    }
    if (!file) {
      alert("Please select a file!");
      return;
    }
    if (!discordName.trim()) {
        alert("Please enter your Discord Username so we can identify you!");
        return;
    }

    setLoading(true);
    try {
      const fileName = `${Date.now()}-${file.name.replace(/\s/g, '')}`;
      
      const { error: uploadError } = await supabase.storage
        .from("uploads")
        .upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("uploads")
        .getPublicUrl(fileName);

      const payload = {
            user_id: user ? user.id : null, 
            discord_id: user ? user.user_metadata.provider_id : null,
            wallet_address: address || "Discord-User", 
            content_type: type,
            description: desc,
            image_url: publicUrl,
            message_link: msgLink || null,
            is_encrypted: isEncrypted,
            discord_username: discordName,
            avatar_url: avatarUrl || "https://cdn.discordapp.com/embed/avatars/0.png" 
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
    <div className="min-h-screen bg-black text-white font-mono selection:bg-green-500 selection:text-black">
      
      {/* --- 🔥 RESTORED NAVBAR (Jo Gayab Ho Gaya Tha) --- */}
      <nav className="border-b border-green-900/50 p-6 flex justify-between items-center backdrop-blur-sm sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2">
          <ShieldCheck className="text-green-500 w-8 h-8" />
          <span className="text-2xl font-bold tracking-tighter">
            SEISMIC <span className="text-green-500">ARCHIVES</span>
          </span>
        </Link>
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

      {/* --- MAIN UPLOAD SECTION --- */}
      <div className="p-8 flex justify-center items-center min-h-[85vh]">
        <div className="max-w-xl w-full bg-gray-900/50 border border-gray-800 p-8 rounded-2xl relative">
            
            <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-gray-500 hover:text-white transition text-xs font-bold uppercase tracking-wider">
                <ArrowLeft size={14} /> Cancel
            </Link>

            <div className="mt-8">
                <h1 className="text-3xl font-bold mb-6 text-center">Archive Artifact 📂</h1>
                
                {/* --- INPUT FIELDS --- */}
                <div className="space-y-6">
                    
                    {/* IDENTITY INPUT */}
                    <div>
                        <label className="block text-gray-400 mb-2 text-sm flex items-center gap-2">
                            <UserCircle size={14}/> Contributor Identity
                        </label>
                        <div className="flex gap-2">
                            {avatarUrl && <img src={avatarUrl} className="w-10 h-10 rounded-full border border-gray-700" />}
                            <input 
                                type="text" 
                                placeholder="Discord Username (e.g. Syed#1234)" 
                                value={discordName} 
                                onChange={(e) => setDiscordName(e.target.value)}
                                disabled={!!user} 
                                className={`block w-full text-sm border rounded-lg p-2 outline-none ${user ? "bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed" : "bg-black text-white border-gray-700 focus:border-green-500"}`}
                            />
                        </div>
                    </div>

                    {/* FILE INPUT */}
                    <div>
                        <label className="block text-gray-400 mb-2 text-sm">Upload Evidence</label>
                        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-green-900/20 file:text-green-500 border border-gray-700 rounded-lg p-2" />
                    </div>

                    {/* ENCRYPTION TOGGLE */}
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

                    <textarea rows={2} placeholder="Description..." value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full bg-black border border-gray-700 rounded p-3 focus:border-green-500 outline-none" />

                    <div>
                        <label className="block text-gray-400 mb-2 text-sm flex items-center gap-2"><LinkIcon size={14} /> Discord Message Link (Optional)</label>
                        <input type="text" placeholder="https://discord.com/channels/..." value={msgLink} onChange={(e) => setMsgLink(e.target.value)} className="w-full bg-black border border-gray-700 rounded p-3 focus:border-green-500 outline-none text-sm text-green-400" />
                    </div>
                    
                    <button onClick={handleUpload} disabled={loading} className="w-full bg-green-600 hover:bg-green-500 text-black font-bold py-4 rounded-xl flex justify-center items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? <Loader2 className="animate-spin" /> : <UploadCloud />} {loading ? "ENCRYPTING & UPLOADING..." : "ARCHIVE TO VAULT"}
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}