import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/components/LanguageProvider";
import { getLanguage } from "@/lib/i18n/server";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pocket Manager",
  description: "Personal finance manager for students",
};

// Sahifa ko'rinishidan oldin saqlangan mavzuni qo'llaydi (yonib qolishning oldini oladi)
const themeScript = `(function(){try{var t=localStorage.getItem("theme");var dark=t==="light"?false:t==="system"?window.matchMedia("(prefers-color-scheme: dark)").matches:true;document.documentElement.dataset.theme=dark?"dark":"light";}catch(e){document.documentElement.dataset.theme="dark";}})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
    const lang = await getLanguage();
  return (
    <html
      lang={lang}
      data-theme="dark"
      className={geistSans.variable}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased">
        <LanguageProvider lang={lang}>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}