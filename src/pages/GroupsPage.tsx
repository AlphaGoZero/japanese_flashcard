/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { Users, Plus, Crown, UserPlus } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card, CardContent, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../stores/authStore';

interface StudyGroup {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  isPublic: boolean;
  inviteCode: string;
  memberCount: number;
  weeklyGoal: number;
  currentProgress: number;
  role?: string;
}

export const GroupsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [myGroups, setMyGroups] = useState<StudyGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [publicGroupsRes, memberGroupsRes] = await Promise.all([
        supabase.from('study_groups').select('*').eq('is_public', true).order('created_at', { ascending: false }),
        supabase.from('group_members').select('*, study_groups(*), users!inner(display_name, avatar_url, xp)').eq('user_id', user?.id),
      ]);

      const publicGroups = (publicGroupsRes.data || []).map((g: any) => ({
        id: g.id,
        name: g.name,
        description: g.description,
        creatorId: g.creator_id,
        isPublic: g.is_public,
        inviteCode: g.invite_code,
        memberCount: 0,
        weeklyGoal: 1000,
        currentProgress: 0,
      }));

      const myGroupData = (memberGroupsRes.data || []).map((m: any) => ({
        id: m.study_groups.id,
        name: m.study_groups.name,
        description: m.study_groups.description,
        creatorId: m.study_groups.creator_id,
        isPublic: m.study_groups.is_public,
        inviteCode: m.study_groups.invite_code,
        memberCount: 0,
        weeklyGoal: 1000,
        currentProgress: 0,
        role: m.role,
      }));

      setGroups(publicGroups);
      setMyGroups(myGroupData);
    } catch (error) {
      console.error('Failed to load groups:', error);
    }
    setIsLoading(false);
  };

  const handleCreateGroup = async () => {
    if (!user || !newGroupName) return;
    try {
      const inviteCode = crypto.randomUUID();
      const { data: group, error } = await supabase
        .from('study_groups')
        .insert({
          name: newGroupName,
          description: newGroupDesc,
          creator_id: user.id,
          is_public: true,
          invite_code: inviteCode,
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.from('group_members').insert({
        group_id: group.id,
        user_id: user.id,
        role: 'admin',
      });

      setShowCreateModal(false);
      setNewGroupName('');
      setNewGroupDesc('');
      loadData();
    } catch (error) {
      console.error('Failed to create group:', error);
    }
  };

  const handleJoinGroup = async () => {
    if (!user || !joinCode) return;
    try {
      const { data: group } = await supabase
        .from('study_groups')
        .select('id')
        .eq('invite_code', joinCode)
        .single();

      if (!group) {
        alert('Invalid invite code');
        return;
      }

      const { error } = await supabase.from('group_members').insert({
        group_id: group.id,
        user_id: user.id,
        role: 'member',
      });

      if (error) throw error;

      setJoinCode('');
      loadData();
    } catch (error) {
      console.error('Failed to join group:', error);
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (!user) return;
    try {
      await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      loadData();
    } catch (error) {
      console.error('Failed to leave group:', error);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Study Groups</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Join groups to learn together and stay motivated</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus size={18} className="mr-2" />
            Create Group
          </Button>
        </div>

        {/* My Groups */}
        {myGroups.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Crown className="text-yellow-500" size={20} />
                <h2 className="text-lg font-semibold">My Groups</h2>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myGroups.map((group) => (
                  <div key={group.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{group.name}</h3>
                      {group.role === 'admin' && <Crown className="text-yellow-500" size={16} />}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                      {group.description || 'No description'}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Users size={14} />
                        {group.memberCount} members
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => handleLeaveGroup(group.id)}>
                        Leave
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Join with Code */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Join a Group</h2>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter invite code..."
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <Button onClick={handleJoinGroup} disabled={!joinCode}>
                <UserPlus size={18} className="mr-2" />
                Join
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Public Groups */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="text-primary-600" size={20} />
              <h2 className="text-lg font-semibold">Public Groups</h2>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                ))}
              </div>
            ) : groups.length > 0 ? (
              <div className="space-y-3">
                {groups.filter(g => !myGroups.find(mg => mg.id === g.id)).map((group) => (
                  <div key={group.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{group.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{group.description}</p>
                    </div>
                    <Button size="sm">View</Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No public groups available. Create one!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <h2 className="text-lg font-semibold">Create Study Group</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Group Name
                  </label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="e.g., Japanese Learners"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    value={newGroupDesc}
                    onChange={(e) => setNewGroupDesc(e.target.value)}
                    placeholder="What is this group about?"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </Button>
                  <Button className="flex-1" onClick={handleCreateGroup} disabled={!newGroupName}>
                    Create
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};
