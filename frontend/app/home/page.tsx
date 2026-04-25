import {Suspense} from "react";
import HomeQuestionsClient from "@/app/home/home-questions-client";

export default function HomePage() {
    return (
        <div className="content-max-800">
            <Suspense fallback={<p className="text-gray-text py-8">Loading…</p>}>
                <HomeQuestionsClient/>
            </Suspense>
        </div>
    );
}
