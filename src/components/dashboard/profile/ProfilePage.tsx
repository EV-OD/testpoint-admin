
"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getProfileByUserId } from '@/lib/supabase/queries';
import { useToast } from '@/hooks/use-toast';

export function ProfilePage() {
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const { toast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profileData, error } = await getProfileByUserId(user.id);
        if (error) {
          toast({ title: 'Error fetching profile', description: error.message, variant: 'destructive' });
        } else {
          setProfile(profileData);
        }
      }
      setLoading(false);
    };

    fetchProfile();
  }, [supabase, toast]);

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return names[0][0] || '';
  };

  const getRoleBadgeVariant = (role: User['role']): 'default' | 'secondary' | 'destructive' => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'teacher':
        return 'secondary';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="flex items-center space-x-6">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-6 w-20" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profile Not Found</CardTitle>
          <CardDescription>We could not load your profile data.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>My Profile</CardTitle>
        <CardDescription>Your personal information and role.</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center space-x-6">
        <Avatar className="h-24 w-24">
          <AvatarFallback>{getInitials(profile.name)}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-2xl font-bold">{profile.name}</h2>
          <p className="text-muted-foreground">{profile.email}</p>
          <Badge variant={getRoleBadgeVariant(profile.role)} className="capitalize mt-2 text-sm">
            {profile.role}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
