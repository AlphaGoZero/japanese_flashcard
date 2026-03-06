import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search,
  MessageCircle, 
  Globe, 
  Clock,
  UserPlus,
  X,
  Send,
  CheckCircle
} from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../stores/authStore';

interface ExchangeProfile {
  id: string;
  user_id: string;
  native_language: string;
  target_language: string;
  proficiency_level: string;
  timezone: string;
  bio: string;
  interests: string[];
  is_available: boolean;
  display_name?: string;
}

const languages = [
  'English', 'Japanese', 'Chinese', 'Korean', 'Spanish', 
  'French', 'German', 'Italian', 'Portuguese', 'Russian'
];

const proficiencyLevels = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' }
];

const timezones = [
  'UTC-12', 'UTC-8', 'UTC-5', 'UTC', 'UTC+1', 'UTC+5', 'UTC+8', 'UTC+9', 'UTC+12'
];

const interests = [
  'Music', 'Anime', 'Movies', 'Travel', 'Food', 'Sports', 
  'Technology', 'Art', 'Reading', 'Gaming'
];

export const ExchangePage: React.FC = () => {
  const { user } = useAuthStore();
  const [profiles, setProfiles] = useState<ExchangeProfile[]>([]);
  const [myProfile, setMyProfile] = useState<ExchangeProfile | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<ExchangeProfile | null>(null);
  const [message, setMessage] = useState('');
  
  const [filters, setFilters] = useState({
    nativeLanguage: '',
    targetLanguage: '',
    proficiency: ''
  });

  const [formData, setFormData] = useState({
    nativeLanguage: 'English',
    targetLanguage: 'Japanese',
    proficiency: 'beginner',
    timezone: 'UTC+9',
    bio: '',
    interests: [] as string[]
  });

  useEffect(() => {
    fetchProfiles();
    fetchMyProfile();
  }, []);

  const fetchProfiles = async () => {
    try {
      let query = supabase
        .from('language_exchange')
        .select('*')
        .eq('is_available', true);

      if (filters.nativeLanguage) {
        query = query.eq('native_language', filters.nativeLanguage);
      }
      if (filters.targetLanguage) {
        query = query.eq('target_language', filters.targetLanguage);
      }
      if (filters.proficiency) {
        query = query.eq('proficiency_level', filters.proficiency);
      }

      const { data, error } = await query;
      if (error) throw error;

      const profilesWithNames = await Promise.all(
        (data || []).map(async (profile) => {
          const { data: userData } = await supabase
            .from('users')
            .select('display_name')
            .eq('id', profile.user_id)
            .single();
          
          return {
            ...profile,
            display_name: userData?.display_name || 'Anonymous'
          };
        })
      );

      setProfiles(profilesWithNames.filter(p => p.user_id !== user?.id));
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  const fetchMyProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('language_exchange')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        setMyProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleCreateProfile = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('language_exchange')
        .insert({
          user_id: user.id,
          native_language: formData.nativeLanguage,
          target_language: formData.targetLanguage,
          proficiency_level: formData.proficiency,
          timezone: formData.timezone,
          bio: formData.bio,
          interests: formData.interests,
          is_available: true
        });

      if (error) throw error;
      setShowCreateModal(false);
      fetchMyProfile();
    } catch (error) {
      console.error('Error creating profile:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!user || !selectedProfile || !message.trim()) return;
    try {
      const { error } = await supabase
        .from('exchange_messages')
        .insert({
          sender_id: user.id,
          receiver_id: selectedProfile.user_id,
          message: message.trim()
        });

      if (error) throw error;
      setShowMessageModal(false);
      setMessage('');
      alert('Message sent!');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const filteredProfiles = profiles.filter(p => {
    if (filters.nativeLanguage && p.native_language !== filters.nativeLanguage) return false;
    if (filters.targetLanguage && p.target_language !== filters.targetLanguage) return false;
    if (filters.proficiency && p.proficiency_level !== filters.proficiency) return false;
    return true;
  });

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Language Exchange
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Find language exchange partners and practice together
          </p>
        </div>

        {!myProfile ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="w-16 h-16 text-orange-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Join the Language Exchange Community
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Create your profile and find partners to practice Japanese with
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Create Profile
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold">Your Profile is Active</h3>
                    <p className="text-orange-100 text-sm">
                      Looking to learn {myProfile.target_language} from {myProfile.native_language} speakers
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex-1 min-w-[200px]">
                <select
                  value={filters.nativeLanguage}
                  onChange={(e) => setFilters({...filters, nativeLanguage: e.target.value})}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                >
                  <option value="">Native Language</option>
                  {languages.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <select
                  value={filters.targetLanguage}
                  onChange={(e) => setFilters({...filters, targetLanguage: e.target.value})}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                >
                  <option value="">Learning</option>
                  {languages.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
              <Button onClick={() => fetchProfiles()}>
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredProfiles.map((profile) => (
                <Card key={profile.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {profile.display_name}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          profile.proficiency_level === 'advanced' ? 'bg-green-100 text-green-700' :
                          profile.proficiency_level === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {profile.proficiency_level}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Globe className="w-4 h-4" />
                        <span>Native: {profile.native_language}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Globe className="w-4 h-4" />
                        <span>Learning: {profile.target_language}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>Timezone: {profile.timezone}</span>
                      </div>
                    </div>

                    {profile.bio && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                        {profile.bio}
                      </p>
                    )}

                    {profile.interests && profile.interests.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {profile.interests.slice(0, 3).map((interest, idx) => (
                          <span key={idx} className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            {interest}
                          </span>
                        ))}
                      </div>
                    )}

                    <Button 
                      onClick={() => {
                        setSelectedProfile(profile);
                        setShowMessageModal(true);
                      }}
                      className="w-full"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Message
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredProfiles.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No partners found. Try adjusting your filters.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Create Profile
                  </h2>
                  <button onClick={() => setShowCreateModal(false)}>
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Native Language
                    </label>
                    <select
                      value={formData.nativeLanguage}
                      onChange={(e) => setFormData({...formData, nativeLanguage: e.target.value})}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                    >
                      {languages.map(lang => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Learning
                    </label>
                    <select
                      value={formData.targetLanguage}
                      onChange={(e) => setFormData({...formData, targetLanguage: e.target.value})}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                    >
                      {languages.map(lang => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Proficiency Level
                    </label>
                    <select
                      value={formData.proficiency}
                      onChange={(e) => setFormData({...formData, proficiency: e.target.value})}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                    >
                      {proficiencyLevels.map(level => (
                        <option key={level.value} value={level.value}>{level.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Timezone
                    </label>
                    <select
                      value={formData.timezone}
                      onChange={(e) => setFormData({...formData, timezone: e.target.value})}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                    >
                      {timezones.map(tz => (
                        <option key={tz} value={tz}>{tz}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Bio
                    </label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({...formData, bio: e.target.value})}
                      placeholder="Tell others about yourself..."
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Interests
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {interests.map(interest => (
                        <button
                          key={interest}
                          onClick={() => {
                            const newInterests = formData.interests.includes(interest)
                              ? formData.interests.filter(i => i !== interest)
                              : [...formData.interests, interest];
                            setFormData({...formData, interests: newInterests});
                          }}
                          className={`px-3 py-1 text-sm rounded-full border ${
                            formData.interests.includes(interest)
                              ? 'bg-orange-500 text-white border-orange-500'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}
                        >
                          {interest}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button onClick={handleCreateProfile} className="w-full">
                    Create Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {showMessageModal && selectedProfile && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="max-w-md w-full mx-4">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Message {selectedProfile.display_name}
                  </h2>
                  <button onClick={() => setShowMessageModal(false)}>
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your message..."
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg mb-4"
                  rows={4}
                />

                <Button onClick={handleSendMessage} className="w-full">
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};
