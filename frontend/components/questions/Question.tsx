import {HomePageQuestionProps} from "@/app/home/types";
import {pluralEn} from "@/lib/pluralize";
import Tag from "@/components/tags/Tag";
import {QuestionMode} from "@/global_types/types";
import Link from "next/link";
import AvatarAndUsernameHolder from "@/components/holders/avatar-and-username-holder";

export default function Question({
    question,
    mode,
    showTopBorder = false,
}: {
    question: HomePageQuestionProps;
    mode: QuestionMode;
    showTopBorder?: boolean;
}) {
    const formattedDateAdded = new Intl.DateTimeFormat("en-US", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "UTC",
    }).format(new Date(question.date_added));

    const content = (
        <div className={`pt-6 mb-6 ${showTopBorder ? "border-t border-separator" : ""}`}>
            <div className="flex flex-col gap-5">
                <AvatarAndUsernameHolder username={question.username}/>
                <div>
                    <p className="text-question-header text-bright-text font-bold mb-2 whitespace-pre-line">
                        {question.title}
                    </p>
                    <p className="whitespace-pre-line">{question.text}</p>
                    <div className="flex-wrap flex gap-2 mt-4">
                        {question.tags.map(tagText => {
                            return <Tag tagText={tagText} key={tagText}/>;
                        })}
                    </div>
                </div>
                <div className="flex justify-between gap-2">
                    <p className="text-gray-text">{formattedDateAdded}</p>
                    <p className="text-gray-text">
                        {question.answers_count === 0
                            ? "Answered by AI"
                            : `${question.answers_count} ${pluralEn(question.answers_count, "answer", "answers")} + AI`}
                    </p>
                </div>
            </div>
        </div>
    );

    if (mode === QuestionMode.HOME_PAGE) {
        return (
            <Link href={`/questions/${question.id}`}>
                {content}
            </Link>
        );
    }

    return content;
}