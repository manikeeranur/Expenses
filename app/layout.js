import { Inter } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";
import { auth } from "@/auth";
import { getUnreadNotificationCount } from "@/lib/data";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "Monthly Expenses",
  description: "Track your income, manage expenses, and achieve your financial goals.",
};

export const viewport = {
  themeColor: "#f4f5fb",
};

const THEME_SCRIPT = `
try {
  var theme = localStorage.getItem('theme');
  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  }
} catch (e) {}
`;

export default async function RootLayout({ children }) {
  const session = await auth();
  const unreadCount = session?.user?.id ? await getUnreadNotificationCount(session.user.id) : 0;

  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full bg-background text-foreground">
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <AppShell user={session?.user} unreadCount={unreadCount}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
