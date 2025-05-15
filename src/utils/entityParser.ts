// File: src/utils/entityParser.ts

/**
 * Parses Rasa NLU entity markdown from examples.
 * Example format: "My phone is [12345](phone_number)"
 * @param examples - Array of example strings.
 * @returns An array of unique entity names found.
 */
export function parseEntitiesFromExamples(examples: string[]): string[] {
  const entityRegex = /\[.*?\]\((.*?)\)/g; // Capture group 1 is the entity name
  const entities = new Set<string>();

  examples.forEach(example => {
    let match;
    while ((match = entityRegex.exec(example)) !== null) {
      if (match[1]) { // Ensure the capture group exists and is not empty
        entities.add(match[1].trim());
      }
    }
  });

  return Array.from(entities);
}

/**
 * Strips Rasa NLU entity markdown from a single example string.
 * @param example - The example string with potential markdown.
 * @returns The example string with markdown removed.
 */
export function stripEntities(example: string): string {
  const entityRegex = /\[(.*?)\]\(.*?\)/g; // Capture group 1 is the value
  return example.replace(entityRegex, '$1');
}

/**
 * Strips Rasa NLU entity markdown from an array of examples.
 * @param examples - Array of example strings.
 * @returns Array of examples with markdown removed.
 */
export function stripEntitiesFromExamples(examples: string[]): string[] {
    return examples.map(stripEntities);
}