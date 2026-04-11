import {Suspense} from "react";
import {ProtectedRoute} from "@/components/auth/ProtectedRoute";
import MyAnswersContent from "@/components/activity/MyAnswersContent";

export default function MyAnswersPage() {
    return (
        <ProtectedRoute>
            <Suspense fallback={<p className="text-gray-text py-8">Loading…</p>}>
                <MyAnswersContent/>
            </Suspense>
        </ProtectedRoute>
    );
}
