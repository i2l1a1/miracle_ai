export default function AuthButtonSmall({onClick}: { onClick: () => void }) {
    return (
        <div onClick={onClick} className="bg-accent cursor-pointer px-5 py-3 rounded-xl text-bright-text mr-4">Log
            in</div>
    );
}
