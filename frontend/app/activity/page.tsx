import {ProtectedRoute} from "@/components/auth/ProtectedRoute";

export default function ActivityPage() {
    return (
        <ProtectedRoute>
            <div>Activity</div>
        </ProtectedRoute>
    );
}
