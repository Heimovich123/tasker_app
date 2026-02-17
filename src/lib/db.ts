import fs from 'fs';
import path from 'path';
import { Task, Project, CompletionRecord } from '@/types';

export interface DbData {
    tasks: Task[];
    projects: Project[];
    stats: CompletionRecord[];
    deleted: Task | null;
}

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

function ensureDbFile(): void {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(DB_PATH)) {
        const initial: DbData = { tasks: [], projects: [], stats: [], deleted: null };
        fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), 'utf-8');
    }
}

export function readDb(): DbData {
    ensureDbFile();
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
}

export function writeDb(data: DbData): void {
    ensureDbFile();
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}
