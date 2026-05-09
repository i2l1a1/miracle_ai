import {HomePageQuestionProps} from "@/app/home/types";
import {pluralRu} from "@/lib/pluralize";
import Tag from "@/components/tags/Tag";
import {QuestionMode} from "@/global_types/types";
import Link from "next/link";
import AvatarAndUsernameHolder from "@/components/holders/avatar-and-username-holder";
import MultilineText from "@/components/text/multiline-text";
import RichText from "@/components/text/rich-text";
import DeleteOverflowMenu from "@/components/menus/delete-overflow-menu";
import {deleteQuestion} from "@/lib/dataService";
import {CLIENT_API_URL} from "@/lib/apiConfig";
import {truncateText} from "@/lib/textTruncation";

export default function Question({
    question,
    mode,
    showTopBorder = false,
    showOwnerMenu = false,
    onQuestionDeleted,
    answersSummaryText,
}: {
    question: HomePageQuestionProps;
    mode: QuestionMode;
    showTopBorder?: boolean;
    showOwnerMenu?: boolean;
    onQuestionDeleted?: () => void;
    answersSummaryText?: string;
}) {

    const questionTitleForView =
        mode === QuestionMode.HOME_PAGE
            ? truncateText(question.title, 100)
            : question.title;

    const questionTextForView =
        mode === QuestionMode.HOME_PAGE
            ? truncateText(question.text)
            : question.text;

    const formattedDateAdded = new Intl.DateTimeFormat("en-US", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "UTC",
    }).format(new Date(question.date_added));

    const menu =
        showOwnerMenu && onQuestionDeleted ? (
            <DeleteOverflowMenu
                ariaLabel="Question actions"
                onDelete={() => deleteQuestion(question.id, CLIENT_API_URL)}
                onDeleted={onQuestionDeleted}
            />
        ) : null;

    const resolvedAnswersSummaryText =
        answersSummaryText ??
        (question.answers_count === 0
            ? "Есть только ИИ-ответ"
            : `${question.answers_count} ${pluralRu(question.answers_count, "ответ", "ответа", "ответов")} + ИИ`);

    const bodyBlock = (
        <div className="flex flex-col px-2">
            <div>
                <MultilineText
                    text={questionTitleForView}
                    className="text-question-header text-bright-text font-bold mb-2"
                />
              <RichText text={questionTextForView} />
                <div className="flex-wrap flex gap-2 mt-4">
                    {question.tags.map((tagText) => (
                        <Tag tagText={tagText} key={tagText} />
                    ))}
                </div>
            </div>
            <div className="flex justify-between gap-2 mt-[20px]">
                <p className="text-gray-text">{formattedDateAdded}</p>
                <p className="text-gray-text">
                    {resolvedAnswersSummaryText}
                </p>
            </div>
        </div>
    );

    if (mode === QuestionMode.HOME_PAGE) {
        return (
            <div
                className={`pt-6 mb-6 relative group ${showTopBorder ? "border-t border-separator" : ""}`}
            >
                <div className="absolute -left-[4px] -right-[4px] top-[4px] -bottom-[20px] rounded-xl transition-colors duration-150 group-hover:bg-hover-overlay" />
                <Link
                    href={`/questions/${question.id}`}
                    className="absolute inset-0 z-0 rounded-sm"
                    tabIndex={-1}
                    aria-hidden
                />
                <div className="relative z-10 flex flex-col gap-5 px-[4px] pointer-events-none">
                    <div className="flex items-center justify-between gap-2 w-full min-w-0">
                        <div className="min-w-0 pointer-events-none [&_*]:pointer-events-none px-2">
                            <AvatarAndUsernameHolder username={question.username} />
                        </div>
                        {menu ? (
                            <div className="shrink-0 pointer-events-auto">{menu}</div>
                        ) : null}
                    </div>
                    <div className="pointer-events-none [&_*]:pointer-events-none">{bodyBlock}</div>
                </div>
            </div>
        );
    }

    return (
        <div className={`pt-6 mb-6 ${showTopBorder ? "border-t border-separator" : ""}`}>
            <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between gap-2 w-full min-w-0">
                    <div className="min-w-0">
                        <AvatarAndUsernameHolder username={question.username} />
                    </div>
                    {menu}
                </div>
                {bodyBlock}
            </div>
        </div>
    );
}
