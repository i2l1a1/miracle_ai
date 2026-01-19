import Filter from "@/components/filter/filter";
import HomePageQuestion from "@/components/questions/HomePageQuestion";
import {HomePageQuestionType} from "@/app/home/types";
import {fetchData} from "@/lib/dataService";

export default async function HomePage() {
    const questions = await fetchData("http://localhost:8080/all_questions");

    return (
        <>
            <Filter questionsCount={questions.length}/>
            {questions.map((question: HomePageQuestionType) => (
                <HomePageQuestion key={question.id} question={question}/>
            ))}
        </>
    );
}