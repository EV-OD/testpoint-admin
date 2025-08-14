
export type User = {
  id: string; 
  name: string;
  email: string;
  role: 'teacher' | 'student' | 'admin';
  password?: string; // Hashed password from DB or plain text for creation
  groups?: string[];
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
  test_maker?: string; // UID of the user who created the test
};

export type Option = {
  id: string;
  text: string;
  isCorrect: boolean;
};

export type Question = {
  id: string;
  text: string;
  options: Option[];
};
