export default function generateUniqueId(prefix: Prefix): string {
  return prefix.concat(Math.random().toString(36).substr(2, 9));
}

export enum Prefix {
  ERROR = "error-",
  PARAGRAPH_ERROR = "paragraph-error-",
  UNIQUE = "unique-",
  PARAGRAPH = "p-",
}
