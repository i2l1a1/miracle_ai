"use client"

import AuthButtonSmall from "@/components/buttons/auth-button-small";
import {useState, useRef, useEffect} from "react";
import AuthPopup from "@/components/auth/auth-popup";
import UserAvatar from "@/public/icons/user-green.svg"
import Image from "next/image";
import {useAuth} from "@/context/AuthContext";
import AccountMenu from "@/components/menus/account-menu";
import Sidebar from "@/components/menus/sidebar";
import SidebarButtonAndLogo from "@/components/header/sidebar-button-and-logo";

export default function Header() {
    const [showAuth, setShowAuth] = useState(false);
    const {username, loading} = useAuth();
    const [showAccountMenu, setShowAccountMenu] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const avatarRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        if (showSidebar) {
            document.body.classList.add("overflow-hidden");
        } else {
            document.body.classList.remove("overflow-hidden");
        }
    }, [showSidebar]);

    return (
        <div className="sticky top-0 z-20 border-b border-separator h-16 -mx-4 box-border">
            <div
                className="flex items-center justify-between h-full py-[10px] bg-blur-background">
                <SidebarButtonAndLogo onSidebarButtonClick={() => setShowSidebar(true)}/>
                {loading ? (
                    <div className="w-9 h-9 mr-4 bg-separator rounded-full animate-pulse"></div>
                ) : username ? (
                    <Image src={UserAvatar} alt="User Avatar" className="cursor-pointer mr-4" ref={avatarRef}
                           onClick={() => setShowAccountMenu(!showAccountMenu)}/>
                ) : (
                    <AuthButtonSmall onClick={() => setShowAuth(true)}/>
                )}
            </div>
            {showAccountMenu && <AccountMenu onClose={() => setShowAccountMenu(false)} triggerRef={avatarRef}/>}
            {showSidebar && <Sidebar onClose={() => setShowSidebar(false)}/>}
            {showAuth && <AuthPopup onCloseAction={() => setShowAuth(false)}/>}
        </div>
    );
}