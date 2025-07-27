import type { User, Group, Test } from './types';

export const groups: Group[] = [
  { id: 'g1', name: 'Physics - Grade 10' },
  { id: 'g2', name: 'Mathematics - Grade 12' },
  { id: 'g3', name: 'History - Grade 9' },
  { id: 'g4', name: 'Chemistry - Grade 11' },
];

export const users: User[] = [
  { id: 'u1', name: 'Alice Johnson', email: 'alice.j@example.com', role: 'teacher', groupIds: ['g1', 'g4'] },
  { id: 'u2', name: 'Bob Williams', email: 'bob.w@example.com', role: 'student', groupIds: ['g1'] },
  { id: 'u3', name: 'Charlie Brown', email: 'charlie.b@example.com', role: 'student', groupIds: ['g1', 'g2'] },
  { id: 'u4', name: 'Diana Miller', email: 'diana.m@example.com', role: 'teacher', groupIds: ['g2', 'g3'] },
  { id: 'u5', name: 'Eve Davis', email: 'eve.d@example.com', role: 'admin', groupIds: [] },
  { id: 'u6', name: 'Frank Wilson', email: 'frank.w@example.com', role: 'student', groupIds: ['g2'] },
  { id: 'u7', name: 'Grace Moore', email: 'grace.m@example.com', role: 'student', groupIds: ['g3'] },
  { id: 'u8', name: 'Henry Taylor', email: 'henry.t@example.com', role: 'student', groupIds: ['g4'] },
];

export const tests: Test[] = [
  { id: 't1', name: 'Mid-term Exam', groupId: 'g1', timeLimit: 90, questionCount: 50, dateTime: new Date('2024-09-15T10:00:00') },
  { id: 't2', name: 'Final Exam', groupId: 'g2', timeLimit: 120, questionCount: 75, dateTime: new Date('2024-12-10T09:00:00') },
  { id: 't3', name: 'Chapter 1 Quiz', groupId: 'g3', timeLimit: 30, questionCount: 20, dateTime: new Date('2024-08-20T14:00:00') },
  { id: 't4', name: 'Lab Practical', groupId: 'g4', timeLimit: 60, questionCount: 15, dateTime: new Date('2024-10-05T13:00:00') },
  { id: 't5', name: 'Pop Quiz', groupId: 'g1', timeLimit: 15, questionCount: 10, dateTime: new Date('2024-08-01T11:30:00') },
];
