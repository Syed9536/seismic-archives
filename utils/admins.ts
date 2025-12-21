// utils/admins.ts

// Yahan apni Team ke Wallet Addresses daal (Lowercase mein)
export const ADMIN_WALLETS = [
    "0x70...fca3", // Tera Wallet
    "0x123...",    // Team Member 1
    "0xabc...",    // Team Member 2
].map(addr => addr.toLowerCase());

// Yahan apni Team ke Discord IDs daal
export const ADMIN_DISCORD_IDS = [
    "835774287997698058", // Tera Discord ID
    "987654321098765432", // Team Member 1 ID
];

// Helper Function: Check karega ki banda Admin hai ya nahi
export const checkIsAdmin = (walletAddress?: string, discordId?: string) => {
    const isWalletAdmin = walletAddress && ADMIN_WALLETS.includes(walletAddress.toLowerCase());
    const isDiscordAdmin = discordId && ADMIN_DISCORD_IDS.includes(discordId);
    return isWalletAdmin || isDiscordAdmin;
};