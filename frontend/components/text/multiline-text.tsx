export default function MultilineText({
    text,
    className = "",
}: {
    text: string;
    className?: string;
}) {
    const lines = text.split("\n");
    return (
        <div className={className}>
            {lines.map((line, i) =>
                line.length === 0 ? (
                    <span
                        key={i}
                        className="block h-[10] w-full shrink-0"
                        aria-hidden
                    />
                ) : (
                    <span key={i} className="block">
                        {line}
                    </span>
                )
            )}
        </div>
    );
}
