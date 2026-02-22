import {QuestionInnerProps} from "@/app/questions/types";
import {fetchData} from "@/lib/dataService";
import {SERVER_API_URL} from "@/lib/apiConfig";
import QuestionDetailContent from "@/app/questions/[id]/question_detail_content";

export default async function QuestionInner({params}: QuestionInnerProps) {
    const {id: question_id} = await params;

    const data = await fetchData(`${SERVER_API_URL}/get_question/${question_id}`);

    return (
        <QuestionDetailContent
            question={data.question}
            initialAnswers={data.answers}
        />
    );
}