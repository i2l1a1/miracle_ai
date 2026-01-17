import Image from "next/image";
import openSidebarIcon from "@/public/icons/header-open-sidebar.svg";

export default function SidebarButton() {
    return (
        <Image src={openSidebarIcon} alt="Open Sidebar" className="ml-[2px] mr-[2px]"/>
    );
}