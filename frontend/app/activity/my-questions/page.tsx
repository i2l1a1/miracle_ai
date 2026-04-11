import {Suspense} from "react";
import {ProtectedRoute} from "@/components/auth/ProtectedRoute";
import MyQuestionsContent from "@/components/activity/MyQuestionsContent";

export default function MyQuestionsPage() {
    return (
        <ProtectedRoute>
            <Suspense fallback={<p className="text-gray-text py-8">Loading…</p>}>
                <MyQuestionsContent/>
            </Suspense>
        </ProtectedRoute>
    );
}
