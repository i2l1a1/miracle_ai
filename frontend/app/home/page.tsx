import Filter from "@/components/filter/filter";
import Question from "@/components/questions/Question";
import {HomePageQuestionProps} from "@/app/home/types";
import {fetchData} from "@/lib/dataService";
import {SERVER_API_URL} from "@/lib/apiConfig";
import {QuestionMode} from "@/global_types/types";

export default async function HomePage() {
    const questions = await fetchData(`${SERVER_API_URL}/all_questions`);

    return (
        <>
            <Filter questionsCount={questions.length}/>
            {questions.map((question: HomePageQuestionProps, index: number) => (
                <Question
                    key={question.id}
                    question={question}
                    mode={QuestionMode.HOME_PAGE}
                    showTopBorder={index > 0}
                />
            ))}
        </>
    );
}