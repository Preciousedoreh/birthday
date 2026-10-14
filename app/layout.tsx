import type { Metadata } from "next";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/cormorant-garamond/700.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/700.css";
import { birthdayConfig } from "@/birthday.config";
import "./globals.css";

export const metadata: Metadata = {
  title: `A Birthday for ${birthdayConfig.recipientName} | Made With Love`,
  description: `A little world made to celebrate ${birthdayConfig.recipientName}. Open your birthday surprise.`,
  openGraph: {
    title: `Happy Birthday, ${birthdayConfig.recipientName}`,
    description: birthdayConfig.personalMessage,
    type: "website"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
