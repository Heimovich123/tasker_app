import { NextRequest, NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';

// GET /api/stats - получить статистику
export async function GET() {
    const db = readDb();
    return NextResponse.json(db.stats);
}

// POST /api/stats - записать/изменить статистику
// Body: { action: 'record' | 'decrement' }
export async function POST(request: NextRequest) {
    const { action } = await request.json();
    const db = readDb();
    const today = new Date().toISOString().split('T')[0];

    if (action === 'record') {
        const existing = db.stats.find((s) => s.date === today);
        if (existing) {
            existing.count += 1;
        } else {
            db.stats.push({ date: today, count: 1 });
        }
        // Храним последние 90 дней
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 90);
        const cutoffStr = cutoff.toISOString().split('T')[0];
        db.stats = db.stats.filter((s) => s.date >= cutoffStr);
    } else if (action === 'decrement') {
        const existing = db.stats.find((s) => s.date === today);
        if (existing && existing.count > 0) {
            existing.count -= 1;
        }
    }

    writeDb(db);
    return NextResponse.json(db.stats);
}
