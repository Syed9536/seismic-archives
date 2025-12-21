"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { UploadCloud, Loader2, ArrowLeft, MessageSquare, Palette, Smile, Link as LinkIcon } from "lucide-react";
import Link from "next/link";

export default function UploadPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [desc, setDesc] = useState("");
  const [msgLink, setMsgLink] = useState(""); // <--- NAYA FIELD
  const [type, setType] = useState("chat");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setUser(user);
        else router.push("/"); 
    };
    getUser();
  }, [router]);

  const handleUpload = async () => {
    if (!file || !user) {
      alert("Please select a file!");
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

      const { error: dbError } = await supabase
        .from("archives")
        .insert([{
            user_id: user.id,
            discord_id: user.user_metadata.provider_id,
            wallet_address: "Discord-User",
            content_type: type,
            description: desc,
            image_url: publicUrl,
            message_link: msgLink || null, // <--- Link Save kar rahe hain
        }]);

      if (dbError) throw dbError;

      alert("Evidence Archived Successfully! 🔒");
      router.push(`/u/${user.id}`);

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
        <h1 className="text-3xl font-bold mb-8">Archive Contribution 📂</h1>
        
        <div className="space-y-6">
            {/* FILE */}
            <div>
                <label className="block text-gray-400 mb-2 text-sm">Upload Screenshot/Art</label>
                <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-green-900/20 file:text-green-500 border border-gray-700 rounded-lg p-2" />
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

            {/* PROOF LINK (NAYA FEATURE) */}
            <div>
                <label className="block text-gray-400 mb-2 text-sm flex items-center gap-2">
                    <LinkIcon size={14} /> Discord Message Link (Optional)
                </label>
                <input 
                    type="text" 
                    placeholder="https://discord.com/channels/..." 
                    value={msgLink} 
                    onChange={(e) => setMsgLink(e.target.value)} 
                    className="w-full bg-black border border-gray-700 rounded p-3 focus:border-green-500 outline-none text-sm text-green-400" 
                />
                <p className="text-xs text-gray-600 mt-2">Right-click on your message in Discord {'>'} Copy Message Link</p>
            </div>
            
            <button onClick={handleUpload} disabled={loading} className="w-full bg-green-600 hover:bg-green-500 text-black font-bold py-4 rounded-xl flex justify-center items-center gap-2 transition disabled:opacity-50">
              {loading ? <Loader2 className="animate-spin" /> : <UploadCloud />} {loading ? "UPLOADING..." : "SAVE TO VAULT"}
            </button>
          </div>
      </div>
    </div>
  );
}