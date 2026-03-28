import HomeQuestionsClient from "@/app/home/home-questions-client";
import {HomePageQuestionProps} from "@/app/home/types";
import {fetchData} from "@/lib/dataService";
import {SERVER_API_URL} from "@/lib/apiConfig";

export default async function HomePage() {
    const questions = await fetchData(`${SERVER_API_URL}/all_questions`);

    return (
        <HomeQuestionsClient questions={questions as HomePageQuestionProps[]}/>
    );
}
