import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function MyAnswersPage() {
    return (
        <ProtectedRoute>
            <p className="pt-5">my-answers</p>
        </ProtectedRoute>
    );
}
