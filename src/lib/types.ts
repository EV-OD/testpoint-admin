export type User = {
  id: string;
  name: string;
  email: string;
  role: 'teacher' | 'student' | 'admin';
  groupIds: string[];
};

export type Group = {
  id: string;
  name: string;
};

export type Test = {
  id: string;
  name: string;
  groupId: string;
  timeLimit: number; // in minutes
  questionCount: number;
  dateTime: Date;
};
