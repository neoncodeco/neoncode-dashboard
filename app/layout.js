import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Neon Dashboard",
  description: "Next Gen Dashboard",
  icons: {
    icon: "/neon-code-logo.jpg",
    shortcut: "/neon-code-logo.jpg",
    apple: "/neon-code-logo.jpg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
