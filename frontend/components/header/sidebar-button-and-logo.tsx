import SidebarButton from "@/components/buttons/sidebar-button";
import Logo from "@/components/logo/logo";

export default function SidebarButtonAndLogo({onSidebarButtonClick}: { onSidebarButtonClick: () => void }) {
    return (
        <div className="flex items-center">
            <SidebarButton onClick={onSidebarButtonClick}/>
            <Logo/>
        </div>
    );
}