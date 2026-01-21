import {ProtectedRoute} from "@/components/auth/ProtectedRoute";

export default function SettingsPage() {
    return (
        <ProtectedRoute>
            <>
                Settings Page
            </>
        </ProtectedRoute>
    );
}