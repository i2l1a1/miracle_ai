import {ProtectedRoute} from "@/components/auth/ProtectedRoute";

export default function NewQuestionPage() {
    return (
        <ProtectedRoute>
            <>
                New Question
            </>
        </ProtectedRoute>
    );
}