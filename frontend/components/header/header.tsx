import LogInButton from "@/components/buttons/log-in-button";
import Logo from "@/components/logo/logo";
import SidebarButton from "@/components/buttons/sidebar-button";

export default function Header() {
    return (
        <div className="flex items-center justify-between border-b border-separator -mx-4 py-[10px]">
            <div className="flex items-center">
                <SidebarButton/>
                <Logo/>
            </div>
            <LogInButton/>
        </div>
    );
}