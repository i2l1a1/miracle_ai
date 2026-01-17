import type {Metadata} from "next";
import "./globals.css";
import {golosText} from "@/app/fonts";
import Header from "@/components/header/header";

export const metadata: Metadata = {
    title: "Miracle AI",
    description: "Questions, answers, discussions.",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
        <body
            className={`${golosText.className} antialiased`}
        >
        <Header/>
        {children}
        </body>
        </html>
    );
}
