export type User = {
  id: string; 
  name: string;
  email: string;
  role: 'teacher' | 'student' | 'admin';
  password?: string; // Hashed password from DB or plain text for creation
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
