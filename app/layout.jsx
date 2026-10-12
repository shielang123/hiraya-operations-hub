import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { BrandProvider } from "@/components/BrandProvider";
import { DataProvider } from "@/components/DataProvider";

export const metadata = {
  title: "Hiraya Operation Hub",
  description: "Staff operations for Hiraya Farm Resort",
  robots: { index: false, follow: false },
  applicationName: "Hiraya Operation Hub",
};

export const viewport = { themeColor: "#1a4a32" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <BrandProvider>
            <DataProvider>{children}</DataProvider>
          </BrandProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
