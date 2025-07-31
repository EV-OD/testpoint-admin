
"use client";

import { QuestionManagement } from "@/components/dashboard/tests/QuestionManagement";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useState } from "react";

export default function TestQuestionsPage({ params }: { params: { id: string } }) {
  const [activeView, setActiveView] = useState<'tests' | 'users' | 'groups' | 'profile'>('tests');
  
  return (
    <DashboardLayout activeView={activeView} setActiveView={setActiveView}>
      <QuestionManagement testId={params.id} />
    </DashboardLayout>
  );
}
