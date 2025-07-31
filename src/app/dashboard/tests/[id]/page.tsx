
"use client";

import { QuestionManagement } from "@/components/dashboard/tests/QuestionManagement";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useState } from "react";
import { useParams } from "next/navigation";

export default function TestQuestionsPage() {
  const [activeView, setActiveView] = useState<'tests' | 'users' | 'groups' | 'profile'>('tests');
  const params = useParams();
  const testId = typeof params.id === 'string' ? params.id : '';
  
  return (
    <DashboardLayout activeView={activeView} setActiveView={setActiveView}>
      <QuestionManagement testId={testId} />
    </DashboardLayout>
  );
}
