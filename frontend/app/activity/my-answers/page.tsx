import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import MyAnswersContent from "@/components/activity/MyAnswersContent";

export default function MyAnswersPage() {
    return (
        <ProtectedRoute>
            <MyAnswersContent />
        </ProtectedRoute>
    );
}
