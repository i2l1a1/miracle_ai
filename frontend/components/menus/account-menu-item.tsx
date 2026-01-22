import Image from "next/image";
import Link from "next/link";
import {StaticImageData} from "next/image";

type MenuItemType = "standard" | "logout";

type AccountMenuItemProps = {
    icon: StaticImageData;
    text: string;
    onClick?: () => void;
    href?: string;
};

export default function AccountMenuItem({icon, text, onClick, href}: AccountMenuItemProps) {
    const content = (
        <div
            className="flex items-center gap-1 cursor-pointer transition-all duration-150 hover:bg-separator rounded-[10px]"
            onClick={onClick}>
            <Image src={icon} alt={text}/>
            <p className="text-question-header font-bold pr-3">{text}</p>
        </div>
    );

    return href ? <Link href={href}>{content}</Link> : content;
}
