import {momoTrustDisplay} from "@/app/fonts";
import Link from "next/link";

export default function Logo() {
    return (
        <Link href="/" className="flex gap-[5px]">
            <p className={`${momoTrustDisplay.className} text-logo`}>Miracle</p>
            <p className={`${momoTrustDisplay.className} text-logo text-accent`}>AI</p>
        </Link>
    );
}