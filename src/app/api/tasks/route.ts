import { NextRequest, NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { Task } from '@/types';

// GET /api/tasks - получить все задачи
export async function GET() {
    const db = readDb();
    // Миграция старых задач (как было в localStorage-версии)
    const tasks = db.tasks.map((t) => ({
        ...t,
        recurrence: t.recurrence ?? 'none',
        order: t.order ?? 0,
        completedAt: t.completedAt ?? null,
    }));
    return NextResponse.json(tasks);
}

// POST /api/tasks - добавить задачу
export async function POST(request: NextRequest) {
    const task: Task = await request.json();
    const db = readDb();
    task.order = db.tasks.length;
    db.tasks.push(task);
    writeDb(db);
    return NextResponse.json(db.tasks);
}

// PUT /api/tasks - обновить задачу
export async function PUT(request: NextRequest) {
    const updated: Task = await request.json();
    const db = readDb();
    db.tasks = db.tasks.map((t) => (t.id === updated.id ? updated : t));
    writeDb(db);
    return NextResponse.json(db.tasks);
}

// DELETE /api/tasks?id=xxx - удалить задачу (с поддержкой undo)
export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
        return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }
    const db = readDb();
    const deleted = db.tasks.find((t) => t.id === id);
    if (deleted) {
        db.deleted = deleted;
    }
    db.tasks = db.tasks.filter((t) => t.id !== id);
    writeDb(db);
    return NextResponse.json(db.tasks);
}
