"use client"

import AuthButtonSmall from "@/components/buttons/auth-button-small";
import Logo from "@/components/logo/logo";
import SidebarButton from "@/components/buttons/sidebar-button";
import {useState} from "react";
import AuthPopup from "@/components/auth/auth-popup";
import UserAvatar from "@/public/icons/user-green.svg"
import Image from "next/image";
import {useAuth} from "@/context/AuthContext";

export default function Header() {
    const [showAuth, setShowAuth] = useState(false);
    const {username, loading} = useAuth();

    return (
        <div
            className="sticky top-0 z-20 flex items-center justify-between border-b border-separator h-16 bg-background -mx-4 py-[10px]">
            <div className="flex items-center">
                <SidebarButton/>
                <Logo/>
            </div>
            {loading ? (
                <div className="w-9 h-9 mr-4 bg-separator rounded-full animate-pulse"></div>
            ) : username ? (
                <Image src={UserAvatar} alt="User Avatar" className="cursor-pointer mr-4"/>
            ) : (
                <AuthButtonSmall onClick={() => setShowAuth(true)}/>
            )}
            {showAuth && <AuthPopup onCloseAction={() => setShowAuth(false)}/>}
        </div>
    );
}