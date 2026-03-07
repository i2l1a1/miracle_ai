import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import MyQuestionsContent from "@/components/activity/MyQuestionsContent";

export default function MyQuestionsPage() {
    return (
        <ProtectedRoute>
            <MyQuestionsContent />
        </ProtectedRoute>
    );
}
