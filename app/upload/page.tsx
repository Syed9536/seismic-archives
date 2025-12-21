"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { UploadCloud, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function UploadPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [desc, setDesc] = useState("");
  const [type, setType] = useState("meme");
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
      
      // 1. Storage Upload
      const { error: uploadError } = await supabase.storage
        .from("uploads")
        .upload(fileName, file);
      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from("uploads")
        .getPublicUrl(fileName);

      // 3. Database Save (Discord ID ke saath)
      const { error: dbError } = await supabase
        .from("archives")
        .insert([{
            user_id: user.id,
            discord_id: user.user_metadata.provider_id, // <--- YEH NAYA HAI
            wallet_address: "Discord-User",
            content_type: type,
            description: desc,
            image_url: publicUrl,
        }]);

      if (dbError) throw dbError;

      alert("Upload Successful! Redirecting to profile...");
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
        <h1 className="text-3xl font-bold mb-8">Upload Artifact 📂</h1>
        <div className="space-y-6">
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-green-900/20 file:text-green-500 border border-gray-700 rounded-lg p-2" />
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-black border border-gray-700 rounded p-3 focus:border-green-500 outline-none">
                <option value="meme">Meme</option><option value="art">Art</option><option value="thread">Proof of Work</option>
            </select>
            <textarea rows={3} placeholder="Description..." value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full bg-black border border-gray-700 rounded p-3 focus:border-green-500 outline-none" />
            <button onClick={handleUpload} disabled={loading} className="w-full bg-green-600 hover:bg-green-500 text-black font-bold py-4 rounded-xl flex justify-center items-center gap-2 transition disabled:opacity-50">
              {loading ? <Loader2 className="animate-spin" /> : <UploadCloud />} {loading ? "UPLOADING..." : "ARCHIVE NOW"}
            </button>
          </div>
      </div>
    </div>
  );
}