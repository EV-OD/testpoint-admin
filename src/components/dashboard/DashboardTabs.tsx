"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserManagement } from "@/components/dashboard/users/UserManagement";
import { GroupManagement } from "@/components/dashboard/groups/GroupManagement";
import { TestManagement } from "@/components/dashboard/tests/TestManagement";
import { Users, Group as GroupIcon, FileText } from "lucide-react";

export default function DashboardTabs() {
  return (
    <Tabs defaultValue="users" className="w-full">
      <TabsList className="grid w-full h-auto grid-cols-1 md:h-12 md:grid-cols-3">
        <TabsTrigger value="users" className="py-2.5">
          <Users className="w-5 h-5 mr-2" />
          User Management
        </TabsTrigger>
        <TabsTrigger value="groups" className="py-2.5">
          <GroupIcon className="w-5 h-5 mr-2" />
          Group Management
        </TabsTrigger>
        <TabsTrigger value="tests" className="py-2.5">
          <FileText className="w-5 h-5 mr-2" />
          Test Management
        </TabsTrigger>
      </TabsList>
      <TabsContent value="users" className="mt-6">
        <UserManagement />
      </TabsContent>
      <TabsContent value="groups" className="mt-6">
        <GroupManagement />
      </TabsContent>
      <TabsContent value="tests" className="mt-6">
        <TestManagement />
      </TabsContent>
    </Tabs>
  );
}
