"use client";

import * as React from 'react';
import {
  RainbowKitProvider,
  getDefaultWallets,
  getDefaultConfig,
  darkTheme,
} from '@rainbow-me/rainbowkit';
import {
  trustWallet,
  ledgerWallet,
} from '@rainbow-me/rainbowkit/wallets';
import {
  metaMaskWallet,
  walletConnectWallet,
  rainbowWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { WagmiProvider, http } from 'wagmi';
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import '@rainbow-me/rainbowkit/styles.css';

// --- SEISMIC CHAIN SETUP ---
const seismic = {
  id: 5124,
  name: 'Seismic Devnet',
  iconUrl: 'https://seismic.global/favicon.ico', // Seismic ka logo (optional)
  iconBackground: '#fff',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://node-2.seismicdev.net/rpc'] },
  },
  testnet: true,
} as const;

// --- CONFIGURATION ---
const config = getDefaultConfig({
  appName: 'Seismic Archives',
  projectId: 'YOUR_PROJECT_ID', // Reown (WalletConnect) se ID milti hai, abhi ke liye aise hi chalega
  chains: [seismic],
  transports: {
    [seismic.id]: http(),
  },
  ssr: true, // Server Side Rendering fix
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          theme={darkTheme({
            accentColor: '#22c55e', // Neon Green Color
            accentColorForeground: 'black',
            borderRadius: 'small',
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}