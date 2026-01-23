import {ProtectedRoute} from "@/components/auth/ProtectedRoute";

export default function MyQuestionsPage() {
    return (
        <ProtectedRoute>
            <>
                My questions
            </>
        </ProtectedRoute>
    );
}