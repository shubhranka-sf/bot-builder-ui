export function slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove invalid chars
      .replace(/\s+/g, '_')     // Replace whitespace with -
      .replace(/--+/g, '_');    // Replace multiple - with single -
  }
  