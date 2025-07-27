
"use client";

import { Sidebar, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Users, Group as GroupIcon, FileText } from "lucide-react";

type View = 'users' | 'groups' | 'tests';

interface DashboardSidebarProps {
    activeView: View;
    setActiveView: (view: View) => void;
}

export default function DashboardSidebar({ activeView, setActiveView }: DashboardSidebarProps) {
    return (
        <Sidebar>
            <SidebarContent>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton 
                            onClick={() => setActiveView('users')} 
                            isActive={activeView === 'users'}
                            tooltip={{children: "User Management"}}
                        >
                            <Users />
                            <span>User Management</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton 
                            onClick={() => setActiveView('groups')} 
                            isActive={activeView === 'groups'}
                             tooltip={{children: "Group Management"}}
                        >
                            <GroupIcon />
                            <span>Group Management</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton 
                            onClick={() => setActiveView('tests')} 
                            isActive={activeView === 'tests'}
                            tooltip={{children: "Test Management"}}
                        >
                            <FileText />
                            <span>Test Management</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarContent>
        </Sidebar>
    );
}
