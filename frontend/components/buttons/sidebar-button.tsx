import Image from "next/image";
import openSidebarIcon from "@/public/icons/header-open-sidebar.svg";

export default function SidebarButton({onClick}: { onClick: () => void }) {
    return (
        <Image src={openSidebarIcon} alt="Open Sidebar" onClick={onClick} className="ml-[2px] mr-[2px] cursor-pointer"/>
    );
}