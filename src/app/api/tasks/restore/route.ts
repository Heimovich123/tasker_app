import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';

// POST /api/tasks/restore - восстановить последнюю удалённую задачу
export async function POST() {
    const db = readDb();
    if (!db.deleted) {
        return NextResponse.json(db.tasks);
    }
    const restored = db.deleted;
    restored.order = db.tasks.length;
    db.tasks.push(restored);
    db.deleted = null;
    writeDb(db);
    return NextResponse.json(db.tasks);
}
