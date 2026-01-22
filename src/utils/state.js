import { readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const STATE_FILE = join(
  dirname(fileURLToPath(import.meta.url)),
  "../state.json",
);

export const loadState = async () => {
  if (!existsSync(STATE_FILE)) return [];
  const data = await readFile(STATE_FILE, "utf-8");
  return JSON.parse(data);
};

export const saveState = async (articles) => {
  await writeFile(STATE_FILE, JSON.stringify(articles, null, 2));
};

export const isNewArticle = (article, previous) => {
  return !previous.some((prev) => prev.link === article.link);
};

export const resetState = async () => {
  await writeFile(STATE_FILE, "[]");
  console.log("✓ State cleared!");
};
