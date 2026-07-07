import { validateGameContent } from '../../shared/content/validateContent.js';

/** Validate JSON content packs at server startup. @throws {Error} */
export function loadGameContent() {
  const result = validateGameContent();
  if (!result.ok) {
    throw new Error(`Invalid game content:\n${result.errors.join('\n')}`);
  }
  return result;
}
