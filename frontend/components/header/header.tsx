import LogInButton from "@/components/buttons/log-in-button";
import Logo from "@/components/logo/logo";
import SidebarButton from "@/components/buttons/sidebar-button";

export default function Header() {
    return (
        <div className="flex items-center justify-between h-16 border-b border-separator -mx-4">
            <div className="flex items-center">
                <SidebarButton/>
                <Logo/>
            </div>
            <LogInButton/>
        </div>
    );
}