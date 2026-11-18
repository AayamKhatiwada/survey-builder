import fs from "fs/promises";
import path from "path";
import { Survey, SurveyResponse } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const SURVEYS_DIR = path.join(DATA_DIR, "surveys");
const RESPONSES_DIR = path.join(DATA_DIR, "responses");

const locks = new Map<string, Promise<unknown>>();
async function withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = locks.get(key) ?? Promise.resolve();
  const run = prev.then(fn, fn);
  locks.set(
    key,
    run.catch(() => undefined)
  );
  return run;
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

async function writeJson(filePath: string, data: unknown) {
  await withLock(filePath, async () => {
    await ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
  });
}

async function listJsonFiles<T>(dir: string): Promise<T[]> {
  await ensureDir(dir);
  const files = await fs.readdir(dir);
  const items = await Promise.all(
    files
      .filter((f) => f.endsWith(".json"))
      .map((f) => readJson<T>(path.join(dir, f)))
  );
  return items.filter((i): i is Awaited<T> => i !== null);
}

export async function getAllSurveys(): Promise<Survey[]> {
  const surveys = await listJsonFiles<Survey>(SURVEYS_DIR);
  return surveys.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getSurvey(id: string): Promise<Survey | null> {
  return readJson<Survey>(path.join(SURVEYS_DIR, `${id}.json`));
}

export async function saveSurvey(survey: Survey): Promise<void> {
  await writeJson(path.join(SURVEYS_DIR, `${survey.id}.json`), survey);
}

export async function deleteSurvey(id: string): Promise<void> {
  await fs.rm(path.join(SURVEYS_DIR, `${id}.json`), { force: true });
  await fs.rm(path.join(RESPONSES_DIR, id), { recursive: true, force: true });
}

export async function addResponse(response: SurveyResponse): Promise<void> {
  await writeJson(
    path.join(RESPONSES_DIR, response.surveyId, `${response.id}.json`),
    response
  );
}

export async function getResponses(surveyId: string): Promise<SurveyResponse[]> {
  const responses = await listJsonFiles<SurveyResponse>(
    path.join(RESPONSES_DIR, surveyId)
  );
  return responses.sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
}
