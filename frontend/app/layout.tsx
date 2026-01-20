import type {Metadata} from "next";
import "./globals.css";
import {golosText} from "@/app/fonts";
import Header from "@/components/header/header";
import {Providers} from "@/providers";
import React from "react";

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
        <Providers>
            <Header/>
            {children}
        </Providers>
        </body>
        </html>
    );
}
