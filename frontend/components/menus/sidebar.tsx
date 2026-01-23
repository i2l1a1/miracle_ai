import SidebarButtonAndLogo from "@/components/header/sidebar-button-and-logo";
import MenuItem from "@/components/menus/menu-item";
import HomeIcon from "@/public/icons/sidebar-home.svg";
import NewQuestionIcon from "@/public/icons/sidebar-new-question.svg";
import MyQuestionsIcon from "@/public/icons/sidebar-my-questions.svg";
import MyAnswersIcon from "@/public/icons/sidebar-my-answers.svg";
import HowItWorksIcon from "@/public/icons/sidebar-how-it-works.svg";
import {useEffect, useRef} from "react";

export default function Sidebar({onClose}: { onClose: () => void }) {

    const sidebarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                sidebarRef.current &&
                !sidebarRef.current.contains(event.target as Node)
            ) {
                onClose();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
    }, [sidebarRef, onClose]);

    return (
        <div
            className="absolute top-0 h-screen w-[250px] left-0 z-20 border-r border-separator bg-blur-background"
            ref={sidebarRef}>
            <div className="flex flex-col gap-1">
                <div className="flex items-center h-[63px]">
                    <SidebarButtonAndLogo onSidebarButtonClick={onClose}/>
                </div>
                <div className="flex flex-col gap-2 pl-1 pr-4">
                    <MenuItem
                        icon={HomeIcon} text="Home"
                        href="/home" onClick={onClose}
                    ></MenuItem>
                    <MenuItem
                        icon={NewQuestionIcon} text="New question"
                        href="/new-question" onClick={onClose}
                    ></MenuItem>
                    <MenuItem
                        icon={MyQuestionsIcon} text="My questions"
                        href="/my-questions" onClick={onClose}
                    ></MenuItem>
                    <MenuItem
                        icon={MyAnswersIcon} text="My answers"
                        href="/my-answers" onClick={onClose}
                    ></MenuItem>
                    <MenuItem
                        icon={HowItWorksIcon} text="How it works?"
                        href="/how-it-works" onClick={onClose}
                    ></MenuItem>
                </div>
            </div>
        </div>
    );
}