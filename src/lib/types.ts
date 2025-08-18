

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
  status: 'draft' | 'published' | 'completed';
};

export type Option = {
  id: string;
  text: string;
};

export type Question = {
  id:string;
  text: string;
  options: Option[];
  correctOptionIndex: number;
};

export type TestSession = {
    id: string;
    test_id: string;
    student_id: string;
    student_name?: string; // populated from users collection
    start_time: string;
    end_time?: string;
    final_score: number | null;
    status: 'not_started' | 'in_progress' | 'completed' | 'submitted' | 'expired';
    answers: {
        [questionId: string]: {
            selected_answer_index: number;
            is_correct: boolean;
        }
    }
}
