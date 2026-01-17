import type {Metadata} from "next";
import "./globals.css";
import {golosText} from "@/app/fonts";

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
        {children}
        </body>
        </html>
    );
}
