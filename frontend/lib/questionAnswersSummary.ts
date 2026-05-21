import {pluralRu} from "@/lib/pluralize";

export function questionAnswersSummaryText(
    answersCount: number,
    aiGenerating?: boolean
): string {
    if (aiGenerating) {
        return "Ответ от ИИ генерируется";
    }
    if (answersCount === 0) {
        return "Есть только ИИ-ответ";
    }
    return `${answersCount} ${pluralRu(answersCount, "ответ", "ответа", "ответов")} + ИИ`;
}
