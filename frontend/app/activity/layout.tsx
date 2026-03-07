import ActivityTabs from "@/components/activity/ActivityTabs";
import React from "react";

export default function ActivityLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <ActivityTabs />
            {children}
        </>
    );
}
