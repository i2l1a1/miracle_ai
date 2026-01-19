export default function Tag({tagText}: { tagText: string }) {
    return <p className="bg-separator p-2 text-button-text text-bright-text rounded-[10px]" key={tagText}>{tagText}</p>
}