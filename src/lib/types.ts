export type User = {
  id: string; // This will correspond to the auth.users.id
  name: string;
  email: string;
  role: 'teacher' | 'student' | 'admin';
};

export type Group = {
  id: string;
  name: string;
};

export type Test = {
  id: string;
  name: string;
  group_id: string;
  time_limit: number; // in minutes
  question_count: number;
  date_time: string; // ISO 8601 format
};
