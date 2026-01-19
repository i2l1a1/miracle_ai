"use client";

export default function Error({error}: { error: Error }) {
    return <p className="flex justify-center mt-5">{error.message}</p>;
}
