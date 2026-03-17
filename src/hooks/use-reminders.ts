import { useState, useEffect, useCallback } from 'react';
import type { Reminder } from '@/data/reminders';

const STORAGE_KEY = 'iron-forums-reminders';

function isoDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
}

const SEED_REMINDERS: Reminder[] = [
  {
    id: 'demo-1',
    text: 'Follow up with Andrew Klein about marketing strategy',
    categoryId: 'marketing',
    dueDate: isoDate(3),
    completed: false,
    createdAt: new Date().toISOString(),
    source: 'ai',
  },
  {
    id: 'demo-2',
    text: 'Schedule weekly date night with Sarah',
    categoryId: 'marriageSelf',
    dueDate: isoDate(1),
    completed: false,
    createdAt: new Date().toISOString(),
    source: 'ai',
  },
  {
    id: 'demo-3',
    text: 'Book a physical exam — blood pressure was flagged',
    categoryId: 'physicalHealth',
    dueDate: isoDate(5),
    completed: false,
    createdAt: new Date().toISOString(),
    source: 'ai',
  },
  {
    id: 'demo-4',
    text: "Attend men's Bible study Wednesday",
    categoryId: 'intimacyWithJesus',
    dueDate: isoDate(2),
    completed: false,
    createdAt: new Date().toISOString(),
    source: 'ai',
  },
  {
    id: 'demo-5',
    text: 'Interview marketing director candidate',
    categoryId: 'marketing',
    dueDate: isoDate(7),
    completed: false,
    createdAt: new Date().toISOString(),
    source: 'user',
  },
];

function loadReminders(): Reminder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  // Seed on first load
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_REMINDERS));
  return SEED_REMINDERS;
}

function persist(reminders: Reminder[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
}

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>(loadReminders);

  const save = useCallback((next: Reminder[]) => {
    setReminders(next);
    persist(next);
  }, []);

  const addReminder = useCallback((r: Omit<Reminder, 'id' | 'createdAt' | 'completed'>) => {
    const newR: Reminder = {
      ...r,
      id: `r-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
      completed: false,
    };
    save([newR, ...reminders]);
    return newR;
  }, [reminders, save]);

  const completeReminder = useCallback((id: string) => {
    save(reminders.map(r => r.id === id ? { ...r, completed: true } : r));
  }, [reminders, save]);

  const deleteReminder = useCallback((id: string) => {
    save(reminders.filter(r => r.id !== id));
  }, [reminders, save]);

  const getUpcoming = useCallback((days = 7) => {
    const now = new Date();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);
    const nowStr = now.toISOString().split('T')[0];
    const cutoffStr = cutoff.toISOString().split('T')[0];
    return reminders
      .filter(r => !r.completed && r.dueDate <= cutoffStr)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [reminders]);

  const getOverdue = useCallback(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return reminders.filter(r => !r.completed && r.dueDate < todayStr);
  }, [reminders]);

  return { reminders, addReminder, completeReminder, deleteReminder, getUpcoming, getOverdue };
}
