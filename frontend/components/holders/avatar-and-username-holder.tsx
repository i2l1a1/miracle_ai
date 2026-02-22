import Image from "next/image";
import UserAvatar from "@/public/icons/user-green.svg";
import UserBotAvatar from "@/public/icons/user-blue-bot.svg";
import {AvatarAndUsernameHolderProps} from "@/components/holders/types";

export default function AvatarAndUsernameHolder({username, isBot = false}: AvatarAndUsernameHolderProps) {
    return (
        <div className="flex items-center gap-2">
            <Image src={isBot ? UserBotAvatar : UserAvatar} alt={isBot ? "Bot avatar" : "Avatar"}/>
            <p className={isBot ? "font-bold text-accent" : undefined}>{username}</p>
        </div>
    );
}