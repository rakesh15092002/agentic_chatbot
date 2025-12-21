import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./prism.css";
import { ClerkProvider } from "@clerk/nextjs";
import { AppContextProvider } from "@/context/AppContext";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Agentic Chatbot",
  description: "AI-powered agentic chatbot",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <ClerkProvider>
          <AppContextProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                success: {
                  style: {
                    background: "black",
                    color: "white",
                  },
                },
                error: {
                  style: {
                    background: "black",
                    color: "white",
                  },
                },
              }}
            />
            {children}
          </AppContextProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
