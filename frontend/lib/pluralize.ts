export function pluralEn(
    n: number,
    singular: string,
    pluralForm: string
): string {
    return n === 1 ? singular : pluralForm;
}
