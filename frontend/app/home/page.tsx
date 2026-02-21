import Filter from "@/components/filter/filter";
import HomePageQuestion from "@/components/questions/HomePageQuestion";
import {HomePageQuestionType} from "@/app/home/types";
import {fetchData} from "@/lib/dataService";
import {SERVER_API_URL} from "@/lib/apiConfig";

export default async function HomePage() {
    const questions = await fetchData(`${SERVER_API_URL}/all_questions`);

    return (
        <>
            <Filter questionsCount={questions.length}/>
            {questions.map((question: HomePageQuestionType) => (
                <HomePageQuestion key={question.id} question={question}/>
            ))}
        </>
    );
}