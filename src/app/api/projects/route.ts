import { NextRequest, NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { Project } from '@/types';

// GET /api/projects - получить все проекты
export async function GET() {
    const db = readDb();
    return NextResponse.json(db.projects);
}

// POST /api/projects - добавить проект
export async function POST(request: NextRequest) {
    const project: Project = await request.json();
    const db = readDb();
    db.projects.push(project);
    writeDb(db);
    return NextResponse.json(db.projects);
}

// PUT /api/projects - обновить проект
export async function PUT(request: NextRequest) {
    const updated: Project = await request.json();
    const db = readDb();
    db.projects = db.projects.map((p) => (p.id === updated.id ? updated : p));
    writeDb(db);
    return NextResponse.json(db.projects);
}

// DELETE /api/projects?id=xxx - удалить проект
export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
        return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }
    const db = readDb();
    db.projects = db.projects.filter((p) => p.id !== id);
    writeDb(db);
    return NextResponse.json(db.projects);
}
