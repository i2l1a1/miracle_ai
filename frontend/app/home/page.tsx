import {Suspense} from "react";
import HomeQuestionsClient from "@/app/home/home-questions-client";

export default function HomePage() {
    return (
        <Suspense fallback={<p className="text-gray-text py-8 px-4">Loading…</p>}>
            <HomeQuestionsClient/>
        </Suspense>
    );
}
