import {QuestionInnerProps} from "@/app/questions/types";
import {fetchData} from "@/lib/dataService";
import {SERVER_API_URL} from "@/lib/apiConfig";
import Question from "@/components/questions/Question";
import {QuestionMode} from "@/global_types/types";
import AnswerForm from "@/app/questions/[id]/answer_form";
import AnswerList from "@/app/questions/[id]/answer_list";

export default async function QuestionInner({params}: QuestionInnerProps) {
    const {id: question_id} = await params;

    const question = await fetchData(`${SERVER_API_URL}/get_question/${question_id}`);

    return (
        <div className="flex flex-col">
            <Question key={question.id} question={question.question} mode={QuestionMode.QUESTION_INNER} />
            <AnswerList />
            <AnswerForm />
        </div>
    );
}