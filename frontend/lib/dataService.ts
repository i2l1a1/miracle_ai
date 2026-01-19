export async function fetchData(url: string) {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `Failed to fetch questions: ${response.status} ${response.statusText}`
        );
    }

    return await response.json();
}