"use client";

import SidebarButtonAndLogo from "@/components/header/sidebar-button-and-logo";
import MenuItem from "@/components/menus/menu-item";
import HomeIcon from "@/public/icons/sidebar-home.svg";
import NewQuestionIcon from "@/public/icons/sidebar-new-question.svg";
import MyQuestionsIcon from "@/public/icons/sidebar-my-questions.svg";
import MyAnswersIcon from "@/public/icons/sidebar-my-answers.svg";
import HowItWorksIcon from "@/public/icons/sidebar-how-it-works.svg";
import {useEffect, useRef} from "react";
import {useAuth} from "@/context/AuthContext";
import {SidebarProps} from "@/components/menus/types";

export default function Sidebar({onCloseAction, onOpenAuthAction}: SidebarProps) {
    const {username} = useAuth();
    const sidebarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) onCloseAction();
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onCloseAction]);

    const handleNewQuestion = () => {
        if (!username) {
            sessionStorage.setItem("redirectAfterLogin", "/new-question");
            onOpenAuthAction?.();
        }
        onCloseAction();
    };

    return (
        <div className="absolute top-0 h-screen w-[250px] left-0 z-20 border-r border-separator bg-blur-background"
             ref={sidebarRef}>
            <div className="flex flex-col gap-1">
                <div className="flex items-center h-[63px]">
                    <SidebarButtonAndLogo onSidebarButtonClick={onCloseAction}/>
                </div>
                <div className="flex flex-col gap-2 pl-1 pr-4">
                    <MenuItem icon={HomeIcon} text="Home" href="/home" onClick={onCloseAction}/>
                    <MenuItem
                        icon={NewQuestionIcon}
                        text="New question"
                        href={username ? "/new-question" : undefined}
                        onClick={handleNewQuestion}
                    />
                    {username && (
                        <>
                            <MenuItem icon={MyQuestionsIcon} text="My questions" href="/my-questions"
                                      onClick={onCloseAction}/>
                            <MenuItem icon={MyAnswersIcon} text="My answers" href="/my-answers"
                                      onClick={onCloseAction}/>
                        </>
                    )}
                    <MenuItem icon={HowItWorksIcon} text="How it works?" href="/how-it-works" onClick={onCloseAction}/>
                </div>
            </div>
        </div>
    );
}