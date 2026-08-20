import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "LMS-AI | Dynamic Learning Management Platform",
  description: "AI-powered learning platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark')
              } else {
                document.documentElement.classList.remove('dark')
              }
            `,
          }}
        />
      </head>
      <body className="antialiased min-h-screen flex flex-col justify-between bg-background text-foreground transition-colors duration-200">
        {/* Sticky Global Header */}
        <Header />

        {/* Page Viewport Content */}
        <div className="flex-1 flex flex-col">{children}</div>

        <Footer />
      </body>
    </html>
  );
}
