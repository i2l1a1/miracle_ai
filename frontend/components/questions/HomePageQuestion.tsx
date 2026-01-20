import {HomePageQuestionType} from "@/app/home/types";
import Image from "next/image";
import UserAvatar from "@/public/icons/user-green.svg"
import Tag from "@/components/tags/Tag";

export default function HomePageQuestion({question}: { question: HomePageQuestionType }) {
    const formattedDateAdded = new Intl.DateTimeFormat("en-US", {
        dateStyle: "short",
        timeStyle: "short",
    }).format(new Date(question.date_added));

    return (
        <div className={`pt-6 mb-6 ${question.id !== 1 ? "border-t border-separator" : ""}`}>
            <div className="flex flex-col gap-5">
                <div className="flex items-center gap-2">
                    <Image src={UserAvatar} alt="Avatar"/>
                    <p>{question.username}</p>
                </div>
                <div>
                    <p className="text-question-header text-bright-text font-bold mb-2">{question.title}</p>
                    <p>{question.text}</p>
                    <div className="flex-wrap flex gap-2 mt-4">
                        {question.tags.map(tagText => {
                            return <Tag tagText={tagText} key={tagText}/>;
                        })}
                    </div>
                </div>
                <div className="flex justify-between gap-2">
                    <p className="text-gray-text">{formattedDateAdded}</p>
                    <p className="text-gray-text">{question.status}</p>
                </div>
            </div>
        </div>
    );
}