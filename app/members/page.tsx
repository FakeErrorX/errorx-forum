"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Icon } from '@iconify/react';
import Header from "@/components/layout/header";

interface User {
  name: string;
  email: string;
  userId: number;
  image?: string | null;
  username?: string | null;
}

interface Member {
  userId: number; // Custom sequential user ID (only public ID)
  name: string | null;
  username: string | null;
  image: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  createdAt: string;
  postCount: number;
  reputation: number;
  isActive: boolean;
}

export default function MembersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'posts' | 'reputation'>('newest');
  const [isSearching, setIsSearching] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Load current user data
  const loadCurrentUser = async () => {
    if (!session?.user) return;
    
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const userData = await response.json();
        setCurrentUser(userData);
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  // Load members data
  const loadMembers = async () => {
    try {
      const response = await fetch('/api/members');
      if (response.ok) {
        const membersData = await response.json();
        // Ensure membersData is an array
        const membersArray = Array.isArray(membersData) ? membersData : [membersData];
        setMembers(membersArray);
        setFilteredMembers(membersArray);
      }
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort members
  useEffect(() => {
    if (!Array.isArray(members)) {
      setFilteredMembers([]);
      return;
    }

    let filtered = members;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = members.filter(member => 
        member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.bio?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort members
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'posts':
          return b.postCount - a.postCount;
        case 'reputation':
          return b.reputation - a.reputation;
        default:
          return 0;
      }
    });

    setFilteredMembers(filtered);
  }, [members, searchQuery, sortBy]);

  useEffect(() => {
    if (status === "loading") return;
    
    const initializeData = async () => {
      await loadMembers();
      await loadCurrentUser();
    };
    
    initializeData();
  }, [status]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Icon icon="lucide:loader-2" className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isSearching={isSearching}
        currentUser={currentUser}
        searchPlaceholder="Search members..."
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-foreground">Members</h1>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {Array.isArray(filteredMembers) ? filteredMembers.length : 0} members
            </Badge>
          </div>

          {/* Sort Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-center">
                <Tabs value={sortBy} onValueChange={(value) => setSortBy(value as "newest" | "oldest" | "posts" | "reputation")}>
                  <TabsList>
                    <TabsTrigger value="newest">Newest</TabsTrigger>
                    <TabsTrigger value="oldest">Oldest</TabsTrigger>
                    <TabsTrigger value="posts">Most Posts</TabsTrigger>
                    <TabsTrigger value="reputation">Reputation</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardContent>
          </Card>

          {/* Members Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.isArray(filteredMembers) && filteredMembers.map((member) => (
              <Card 
                key={member.userId} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => {
                  if (member.username) {
                    router.push(`/profile/${member.username}`);
                  }
                }}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    {/* Avatar */}
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={member.image || undefined} alt={member.name || "Member"} />
                      <AvatarFallback className="text-xl">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Member Info */}
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">
                        {member.name || "Anonymous"}
                      </h3>
                      {member.username && (
                        <p className="text-sm text-muted-foreground">
                          @{member.username}
                        </p>
                      )}
                       <Badge variant="outline" className="text-xs font-mono bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20 text-green-600 dark:text-green-400 w-fit px-2 py-1">
                         User ID: {member.userId}
                       </Badge>
                      {member.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {member.bio}
                        </p>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Icon icon="lucide:message-square" className="h-4 w-4" />
                        <span>{member.postCount}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Icon icon="lucide:star" className="h-4 w-4" />
                        <span>{member.reputation}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Icon icon="lucide:calendar" className="h-4 w-4" />
                        <span>{formatDate(member.createdAt)}</span>
                      </div>
                    </div>

                    {/* Location - Not available in current schema */}
                    {member.location && (
                      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                        <Icon icon="lucide:map-pin" className="h-4 w-4" />
                        <span>{member.location}</span>
                      </div>
                    )}

                    {/* Website - Not available in current schema */}
                    {member.website && (
                      <div className="flex items-center space-x-1 text-sm">
                        <Icon icon="lucide:globe" className="h-4 w-4" />
                        <a 
                          href={member.website.startsWith('http') ? member.website : `https://${member.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Website
                        </a>
                      </div>
                    )}

                    {/* Member Status */}
                    <div className="flex gap-2">
                      <Badge variant={member.isActive ? "default" : "secondary"}>
                        {member.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {member.postCount > 100 && (
                        <Badge variant="outline">Power User</Badge>
                      )}
                      {member.reputation > 500 && (
                        <Badge variant="outline">Top Contributor</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* No Results */}
          {Array.isArray(filteredMembers) && filteredMembers.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Icon icon="lucide:users" className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No members found</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? "Try adjusting your search terms" : "No members to display"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
