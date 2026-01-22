import SidebarButtonAndLogo from "@/components/header/sidebar-button-and-logo";

export default function Sidebar({onSidebarButtonClick}: { onSidebarButtonClick: () => void }) {

    return (
        <div
            className="absolute top-0 h-screen w-[250px] left-0 z-20 border-r border-separator bg-blur-background">
            <div className="flex items-center h-[63px]">
                <SidebarButtonAndLogo onSidebarButtonClick={onSidebarButtonClick}/>
            </div>
        </div>
    );
}