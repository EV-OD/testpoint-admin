
"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Users, Group as GroupIcon, FileText, Cpu } from "lucide-react";

type View = 'users' | 'groups' | 'tests';

interface DashboardSidebarProps {
    activeView: View;
    setActiveView: (view: View) => void;
}

export default function DashboardSidebar({ activeView, setActiveView }: DashboardSidebarProps) {
    const menuItems = [
        { id: 'users', label: 'User Management', icon: Users },
        { id: 'groups', label: 'Group Management', icon: GroupIcon },
        { id: 'tests', label: 'Test Management', icon: FileText },
    ];

    return (
        <aside className="w-64 flex-shrink-0 bg-sidebar text-sidebar-foreground flex flex-col">
            <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
                <Cpu className="h-8 w-8 text-primary" />
                <h1 className="ml-3 text-xl font-bold">
                    TestPoint
                </h1>
            </div>
            <nav className="flex-1 p-4">
                <ul className="space-y-2">
                    {menuItems.map(item => (
                        <li key={item.id}>
                            <Button
                                variant="ghost"
                                onClick={() => setActiveView(item.id as View)}
                                className={cn(
                                    "w-full justify-start text-base py-6",
                                    activeView === item.id 
                                        ? "bg-primary/10 text-primary hover:bg-primary/20" 
                                        : "hover:bg-primary/10 hover:text-primary"
                                )}
                            >
                                <item.icon className="mr-3 h-5 w-5" />
                                {item.label}
                            </Button>
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
    );
}
