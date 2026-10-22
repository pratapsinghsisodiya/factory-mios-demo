import "./globals.css";
import "./industrial.css";
import "./control-room.css";
import DemoSessionProvider from '../components/DemoSession';
import DemoNotice from "../components/DemoNotice";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Factory-MIOS | Interactive Client Demo",
  description: "Explore manufacturing dashboards and an interactive 3D factory using synthetic sample data.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body><DemoSessionProvider><DemoNotice/>{children}</DemoSessionProvider></body>
    </html>
  );
}
