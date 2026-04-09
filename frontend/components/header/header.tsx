"use client";

import Link from "next/link";
import Image from "next/image";
import {useState, useRef, useEffect} from "react";
import AuthButtonSmall from "@/components/buttons/auth-button-small";
import AuthPopup from "@/components/auth/auth-popup";
import UserAvatar from "@/public/icons/user-green.svg";
import ActivityIcon from "@/public/icons/header-activity.svg";
import NewQuestionIcon from "@/public/icons/header-new-question.svg";
import {useAuth} from "@/context/AuthContext";
import AccountMenu from "@/components/menus/account-menu";
import Sidebar from "@/components/menus/sidebar";
import SidebarButtonAndLogo from "@/components/header/sidebar-button-and-logo";

export default function Header() {
    const [showAuth, setShowAuth] = useState(false);
    const {userId, loading} = useAuth();
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
        <div className="sticky top-0 z-30 border-b border-separator h-16 -mx-4 box-border">
            <div
                className="flex items-center justify-between h-full py-[10px] bg-blur-background">
                <SidebarButtonAndLogo onSidebarButtonClick={() => setShowSidebar(true)}/>
                {loading ? (
                    <div className="w-9 h-9 mr-4 bg-separator rounded-full animate-pulse"/>
                ) : userId ? (
                    <div className="flex items-center gap-1 mr-4">
                        <Link
                            href="/activity/my-questions"
                            className="flex items-center justify-center w-11 h-11 shrink-0 rounded-[10px] text-gray-text hover:bg-separator hover:text-bright-text transition-all duration-150 cursor-pointer"
                        >
                            <Image src={ActivityIcon} alt="Activity" width={44} height={44}/>
                        </Link>
                        <Link
                            href="/new-question"
                            className="flex items-center justify-center w-11 h-11 shrink-0 rounded-[10px] text-gray-text hover:bg-separator hover:text-bright-text transition-all duration-150 cursor-pointer"
                        >
                            <Image src={NewQuestionIcon} alt="New question" width={44} height={44}/>
                        </Link>
                        <Image
                            src={UserAvatar}
                            alt="User Avatar"
                            className="cursor-pointer block"
                            ref={avatarRef}
                            onClick={() => setShowAccountMenu(!showAccountMenu)}
                        />
                    </div>
                ) : (
                    <AuthButtonSmall onClick={() => setShowAuth(true)}/>
                )}
            </div>
            {showAccountMenu && <AccountMenu onClose={() => setShowAccountMenu(false)} triggerRef={avatarRef}/>}
            {showSidebar && (
                <Sidebar
                    onCloseAction={() => setShowSidebar(false)}
                    onOpenAuthAction={() => { setShowSidebar(false); setShowAuth(true); }}
                />
            )}
            {showAuth && <AuthPopup onCloseAction={() => setShowAuth(false)}/>}
        </div>
    );
}