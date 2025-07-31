
"use client";

import { QuestionManagement } from "@/components/dashboard/tests/QuestionManagement";
import { useParams } from "next/navigation";

export default function TestQuestionsPage() {
  const params = useParams();
  const testId = typeof params.id === 'string' ? params.id : '';
  
  return (
      <QuestionManagement testId={testId} />
  );
}
