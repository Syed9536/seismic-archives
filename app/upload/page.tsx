"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { supabase } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { UploadCloud, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function UploadPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  
  const [file, setFile] = useState<File | null>(null);
  const [desc, setDesc] = useState("");
  const [type, setType] = useState("meme");
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file || !isConnected || !address) {
      alert("Please connect wallet and select a file!");
      return;
    }

    setLoading(true);

    try {
      // 1. Upload Image to Supabase Storage
      const fileName = `${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("uploads")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from("uploads")
        .getPublicUrl(fileName);

      // 3. Save Data to Table
      const { error: dbError } = await supabase
        .from("archives")
        .insert([
          {
            wallet_address: address,
            content_type: type,
            description: desc,
            image_url: publicUrl,
            x_link: link,
          },
        ]);

      if (dbError) throw dbError;

      alert("Upload Successful! 🎉");
      router.push("/"); // Home pe wapas bhej do

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
        
        <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-white mb-6 transition">
          <ArrowLeft size={16} /> Back to Vault
        </Link>

        <h1 className="text-3xl font-bold mb-8">Upload Artifact 📂</h1>

        {!isConnected ? (
          <div className="text-red-500 text-center border border-red-900/50 p-4 rounded bg-red-900/10">
            ⚠️ Please Connect Wallet First (Top Right)
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* File Input */}
            <div>
              <label className="block text-gray-400 mb-2 text-sm">Upload Image (Meme/Art)</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-900/20 file:text-green-500 hover:file:bg-green-900/40 cursor-pointer border border-gray-700 rounded-lg p-2"
              />
            </div>

            {/* Content Type */}
            <div>
              <label className="block text-gray-400 mb-2 text-sm">Type</label>
              <select 
                value={type} 
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-black border border-gray-700 rounded p-3 focus:border-green-500 outline-none"
              >
                <option value="meme">Meme</option>
                <option value="art">Art</option>
                <option value="thread">Thread Screenshot</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-gray-400 mb-2 text-sm">Description</label>
              <textarea 
                rows={3}
                placeholder="What is this about?"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="w-full bg-black border border-gray-700 rounded p-3 focus:border-green-500 outline-none"
              />
            </div>

            {/* X Link */}
            <div>
              <label className="block text-gray-400 mb-2 text-sm">X (Twitter) Link (Optional)</label>
              <input 
                type="text" 
                placeholder="https://x.com/..."
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className="w-full bg-black border border-gray-700 rounded p-3 focus:border-green-500 outline-none"
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleUpload}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-500 text-black font-bold py-4 rounded-xl flex justify-center items-center gap-2 transition disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : <UploadCloud />} 
              {loading ? "UPLOADING..." : "ARCHIVE NOW"}
            </button>

          </div>
        )}
      </div>
    </div>
  );
}