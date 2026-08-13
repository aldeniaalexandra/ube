import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  parseCharacterJson,
  validateCharacter,
  CharacterError,
} from "./validate.js";

export { CharacterError, validateCharacter } from "./validate.js";

export async function loadCharacter(path: string) {
  const characterPath = resolve(path);
  const raw = await readFile(characterPath, "utf8");
  try {
    return parseCharacterJson(raw, characterPath);
  } catch (error) {
    if (error instanceof CharacterError && !error.message.startsWith(characterPath)) {
      throw new CharacterError(`${characterPath}: ${error.message}`);
    }
    throw error;
  }
}
