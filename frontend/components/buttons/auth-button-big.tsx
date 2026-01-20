export default function AuthButtonBig({text}: { text: string }) {
    return (
        <button
            type="submit"
            className="absolute bottom-6 left-4 right-4 py-4 bg-accent text-bright-text rounded-xl flex  justify-center"
        >
            {text}
        </button>
    );
}