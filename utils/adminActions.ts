import { supabase } from "@/utils/supabase/client";

// --- 1. DELETE FUNCTION (Universal for Admin & User) ---
export const deleteArtifact = async (artifactId: string, filePath: string) => {
  try {
    // A. Storage se file udao
    const { error: storageError } = await supabase.storage
      .from('artifacts') // Tumhare bucket ka naam
      .remove([filePath]);

    if (storageError) throw storageError;

    // B. Database se entry udao
    const { error: dbError } = await supabase
      .from('artifacts')
      .delete()
      .eq('id', artifactId);

    if (dbError) throw dbError;

    return { success: true };
  } catch (error) {
    console.error("Delete failed:", error);
    return { success: false, error };
  }
};

// --- 2. VERIFY ARTIFACT FUNCTION ---
export const verifyArtifact = async (artifactId: string) => {
  const { error } = await supabase
    .from('artifacts')
    .update({ status: 'verified' })
    .eq('id', artifactId);
  
  return { success: !error };
};

// --- 3. UPGRADE USER ROLE FUNCTION ---
export const markUserForUpgrade = async (userId: string) => {
    // Iske liye hum user ke metadata ko update kar sakte hain
    const { error } = await supabase.auth.admin.updateUserById(
        userId,
        { user_metadata: { role_status: 'ready_for_upgrade' } }
    );
};