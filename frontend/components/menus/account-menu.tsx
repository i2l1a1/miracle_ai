import SettingsIcon from "@/public/icons/account-menu-settings.svg";
import LogOutIcon from "@/public/icons/account-menu-log-out.svg";
import LogOutIconRed from "@/public/icons/account-menu-log-out-red.svg";
import {useAuth} from "@/context/AuthContext";
import {useRouter} from "next/navigation";
import AccountMenuItem from "@/components/menus/account-menu-item";

export default function AccountMenu({onClose}: { onClose: () => void }) {
    const {resetAuth} = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            const response = await fetch("http://localhost:8080/logout", {
                method: "POST",
                credentials: "include",
            });

            if (response.ok) {
                resetAuth();
                onClose();
                router.push("/home");
            } else {
                console.error("Logout failed!");
            }
        } catch (error) {
            console.error("Error during logout:", error);
        }
    };

    return (
        <div
            className="absolute top-16 right-0 z-20 w-max py-1 pr-1 pl-1 border-separator rounded-bl-xl border-b border-l bg-blur-background">
            <div className="flex gap-1 flex-col">
                <AccountMenuItem icon={SettingsIcon} text="Settings" href="/settings" onClick={onClose}/>
                <AccountMenuItem icon={LogOutIcon} text="Log out" onClick={handleLogout}/>
            </div>
        </div>

    );
}