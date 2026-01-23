import {ProtectedRoute} from "@/components/auth/ProtectedRoute";

export default function MyAnswersPage() {
    return (
        <ProtectedRoute>
            <>
                My answers
            </>
        </ProtectedRoute>
    );
}