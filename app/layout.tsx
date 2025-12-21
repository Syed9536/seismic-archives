import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers"; // <--- Yeh Import Add kiya

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Seismic Archives",
  description: "Proof of Contribution Vault",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Poori App ko Providers se wrap kar diya 👇 */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}