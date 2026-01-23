import {ProtectedRoute} from "@/components/auth/ProtectedRoute";

export default function HowItWorks() {
    return (
        <ProtectedRoute>
            <>
                How it works
            </>
        </ProtectedRoute>
    );
}