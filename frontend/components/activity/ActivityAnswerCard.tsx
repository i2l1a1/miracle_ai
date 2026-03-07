import Link from "next/link";

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
        <Link href={`/questions/${item.question_id}`}>
            <div
                className={`pt-6 mb-6 ${showTopBorder ? "border-t border-separator" : ""}`}
            >
                <div className="flex flex-col gap-5">
                    <p className="text-question-header text-bright-text font-bold">
                        {item.question_title}
                    </p>
                    <p className="text-text">{item.text}</p>
                    <div className="flex justify-between gap-2">
                        <p className="text-gray-text">{formattedDate}</p>
                        <p className="text-gray-text">Rating: {item.rating}</p>
                    </div>
                </div>
            </div>
        </Link>
    );
}
