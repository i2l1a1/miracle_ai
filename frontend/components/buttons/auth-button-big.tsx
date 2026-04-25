export default function AuthButtonBig({text}: { text: string }) {
    return (
        <button
            type="submit"
            className="mt-6 w-full cursor-pointer py-4 bg-accent text-bright-text rounded-xl flex justify-center"
        >
            {text}
        </button>
    );
}