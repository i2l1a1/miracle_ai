import Link from "next/link";

export default function LogInButton() {
    return (
        <Link href="/home" className="bg-accent px-5 py-3 rounded-xl text-bright-text mr-4">Log in</Link>
    );
}