// Yahan Team ke Wallet Addresses daal (Comma se separate karke)
export const ADMIN_WALLETS = [
    "0xADb9577555E75EbC5f22da1aE28482be344b2081", 
    "0xAbc...Admin2Address",    
    "0x123...Admin3Address"
].map(addr => addr.toLowerCase()); // Auto-convert to lowercase logic

// Yahan Team ke Discord IDs daal
export const ADMIN_DISCORD_IDS = [
    "835774287997698058", // Tera Discord ID
    "987654321098765432", // Admin 2 ID
];

// Ye logic check karega ki banda list mein hai ya nahi
export const checkIsAdmin = (walletAddress?: string, discordId?: string) => {
    const isWalletAdmin = walletAddress && ADMIN_WALLETS.includes(walletAddress.toLowerCase());
    const isDiscordAdmin = discordId && ADMIN_DISCORD_IDS.includes(discordId);
    return isWalletAdmin || isDiscordAdmin;
};