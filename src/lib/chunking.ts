/**
 * Splits text into chunks ensuring they don't exceed a max size,
 * respecting sentence and paragraph boundaries where possible.
 */
export function recursiveCharacterSplit(
    text: string,
    maxChunkSize: number = 1000,
    overlap: number = 100
): string[] {
    if (text.length <= maxChunkSize) {
        return [text];
    }

    const chunks: string[] = [];
    let startIndex = 0;

    while (startIndex < text.length) {
        const endIndex = startIndex + maxChunkSize;

        if (endIndex >= text.length) {
            chunks.push(text.slice(startIndex));
            break;
        }

        // Try to find a good break point (paragraph, then sentence, then space)
        let breakIndex = -1;
        const separators = ["\n\n", "\n", ". ", " "];

        for (const separator of separators) {
            const lastSeparatorIndex = text.lastIndexOf(separator, endIndex);
            if (lastSeparatorIndex > startIndex + maxChunkSize * 0.5) {
                breakIndex = lastSeparatorIndex + separator.length;
                break;
            }
        }

        // If no good break point found, just hard cut
        if (breakIndex === -1) {
            breakIndex = endIndex;
        }

        chunks.push(text.slice(startIndex, breakIndex).trim());

        // Move start index for next chunk, accounting for overlap
        startIndex = breakIndex - overlap;

        // Prevent infinite loop if overlap pushes us back too far or implementation error
        if (startIndex >= breakIndex) {
            startIndex = breakIndex;
        }
    }

    return chunks;
}
