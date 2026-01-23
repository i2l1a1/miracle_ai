import SidebarButtonAndLogo from "@/components/header/sidebar-button-and-logo";
import MenuItem from "@/components/menus/menu-item";
import HomeIcon from "@/public/icons/sidebar-home.svg";
import NewQuestionIcon from "@/public/icons/sidebar-new-question.svg";
import MyQuestionsIcon from "@/public/icons/sidebar-my-questions.svg";
import MyAnswersIcon from "@/public/icons/sidebar-my-answers.svg";
import HowItWorksIcon from "@/public/icons/sidebar-how-it-works.svg";

export default function Sidebar({onSidebarButtonClick}: { onSidebarButtonClick: () => void }) {

    return (
        <div
            className="absolute top-0 h-screen w-[250px] left-0 z-20 border-r border-separator bg-blur-background">
            <div className="flex flex-col gap-1">
                <div className="flex items-center h-[63px]">
                    <SidebarButtonAndLogo onSidebarButtonClick={onSidebarButtonClick}/>
                </div>
                <div className="flex flex-col gap-2 pl-1 pr-4">
                    <MenuItem icon={HomeIcon} text="Home" href="/home"></MenuItem>
                    <MenuItem icon={NewQuestionIcon} text="New question" href="/new-question"></MenuItem>
                    <MenuItem icon={MyQuestionsIcon} text="My questions" href="/my-questions"></MenuItem>
                    <MenuItem icon={MyAnswersIcon} text="My answers" href="/my-answers"></MenuItem>
                    <MenuItem icon={HowItWorksIcon} text="How it works?" href="/how-it-works"></MenuItem>
                </div>
            </div>
        </div>
    );
}