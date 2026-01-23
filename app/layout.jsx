import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import Header from "@/components/header";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Toaster } from "sonner";

export const metadata = {
  title: "Eventora",
  description: "Eventora is an AI-driven platform for smart event creation, discovery, and management with real-time insights and QR-based ticketing.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`bg-gradient-to-br from-gray-950 via-zinc-900 to-stone-900 text-white`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <ClerkProvider appearance={{ theme: dark }}>
            <ConvexClientProvider>
              {/* Header */}
              <Header />

              <main className="relative min-h-screen container mx-auto pt-40 md:pt-32">

                <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
                  <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl" />
                  <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-600/20 rounded-full blur-3xl" />

                </div>

                <div className="relative z-10 min-h-[80vh]">
                  {children}
                </div>

                <Toaster richColors/>
              </main>
            </ConvexClientProvider>
          </ClerkProvider>
        </ThemeProvider>

      </body>
    </html>
  );
}
