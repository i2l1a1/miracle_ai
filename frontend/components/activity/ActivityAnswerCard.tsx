import Link from "next/link";
import MultilineText from "@/components/text/multiline-text";
import {truncateText} from "@/lib/textTruncation";

export type ActivityAnswerItem = {
    id?: number;
    username: string;
    text: string;
    rating: number;
    is_bot: boolean;
    date_added: string;
    question_id: number;
    question_title: string;
};

export default function ActivityAnswerCard({
    item,
    showTopBorder,
}: {
    item: ActivityAnswerItem;
    showTopBorder: boolean;
}) {
    const formattedDate = new Intl.DateTimeFormat("en-US", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "UTC",
    }).format(new Date(item.date_added));

    return (
        <Link href={`/questions/${item.question_id}`} className="block">
            <div
                className={`pt-6 mb-6 relative group ${showTopBorder ? "border-t border-separator" : ""}`}
            >
                <div className="absolute -left-[4px] -right-[4px] top-[4px] -bottom-[8px] rounded-xl transition-colors duration-150 group-hover:bg-hover-overlay" />
                <div className="relative z-10 flex flex-col gap-5 px-2">
                    <MultilineText
                        text={truncateText(item.question_title, 100)}
                        className="text-question-header text-bright-text font-bold"
                    />
                    <MultilineText text={truncateText(item.text)} className="text-text"/>
                    <div className="flex justify-between gap-2">
                        <p className="text-gray-text">{formattedDate}</p>
                        <p className="text-gray-text">Rating: {item.rating}</p>
                    </div>
                </div>
            </div>
        </Link>
    );
}
