import localFont from "next/font/local";

export const golosText = localFont({
    src: "../public/fonts/GolosText-VariableFont_wght.ttf",
    variable: "--font-golos-text",
    weight: "100 900",
    display: "swap",
});

export const momoTrustDisplay = localFont({
    src: "../public/fonts/MomoTrustDisplay-Regular.ttf",
    variable: "--font-momo-trust-display",
    weight: "400",
    display: "swap",
});
