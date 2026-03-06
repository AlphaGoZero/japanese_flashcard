/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import {
  User,
  Bell,
  Moon,
  Sun,
  Monitor,
  Trash2,
  LogOut,
  Save,
  Camera,
  Download,
  Upload,
  FileJson,
} from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card, CardContent, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import { supabase } from '../services/supabase';
import { downloadExport, exportProgressCSV, importDeckData, validateImportFile } from '../services/exportService';

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [dailyReminder, setDailyReminder] = useState(false);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState('');

  useEffect(() => {
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setNotificationsEnabled(settings.notificationsEnabled ?? true);
      setSoundEnabled(settings.soundEnabled ?? true);
      setDailyReminder(settings.dailyReminder ?? false);
      setReminderTime(settings.reminderTime ?? '09:00');
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    
    if (theme === 'system') {
      root.classList.remove('light', 'dark');
      root.classList.add(systemTheme);
    } else {
      root.classList.remove('light', 'dark');
      root.classList.add(theme);
    }
  }, [theme]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        await supabase
          .from('users')
          .update({ display_name: displayName })
          .eq('id', authUser.id);
      }
      
      localStorage.setItem('userSettings', JSON.stringify({
        notificationsEnabled,
        soundEnabled,
        dailyReminder,
        reminderTime,
      }));
      
      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveMessage('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearData = async () => {
    if (!window.confirm('Are you sure you want to clear all your learning progress? This cannot be undone.')) {
      return;
    }
    
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        await supabase
          .from('user_progress')
          .delete()
          .eq('user_id', authUser.id);
        
        await supabase
          .from('quiz_results')
          .delete()
          .eq('user_id', authUser.id);
        
        await supabase
          .from('game_results')
          .delete()
          .eq('user_id', authUser.id);
      }
      
      alert('All learning progress has been cleared.');
    } catch (error) {
      console.error('Failed to clear data:', error);
      alert('Failed to clear data. Please try again.');
    }
  };

  const handleExportJSON = async () => {
    setIsExporting(true);
    try {
      await downloadExport();
      setSaveMessage('Data exported successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Failed to export:', error);
      setSaveMessage('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const result = await exportProgressCSV();
      if (result) {
        setSaveMessage('Progress exported to CSV successfully!');
      } else {
        setSaveMessage('No progress data to export');
      }
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Failed to export CSV:', error);
      setSaveMessage('Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportDeck = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportMessage('');

    try {
      const validation = await validateImportFile(file);
      if (!validation.valid) {
        setImportMessage(validation.error || 'Invalid file');
        return;
      }

      const result = await importDeckData(file);
      setImportMessage(result.message);
      
      if (result.success) {
        event.target.value = '';
      }
    } catch (error) {
      console.error('Failed to import:', error);
      setImportMessage('Failed to import deck');
    } finally {
      setIsImporting(false);
    }
  };

  const ThemeOption = ({ value, label, icon: Icon }: { value: 'light' | 'dark' | 'system'; label: string; icon: React.ElementType }) => (
    <button
      onClick={() => setTheme(value)}
      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
        theme === value
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
    >
      <Icon className={`${theme === value ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}`} size={24} />
      <span className={`text-sm font-medium ${theme === value ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400'}`}>
        {label}
      </span>
    </button>
  );

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your account and preferences</p>
        </div>

        {/* Profile Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="text-primary-600 dark:text-primary-400" size={20} />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profile</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full object-cover" />
                ) : (
                  <User className="text-primary-600 dark:text-primary-400" size={40} />
                )}
              </div>
              <div>
                <Button variant="outline" size="sm">
                  <Camera className="mr-2" size={16} />
                  Change Photo
                </Button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter your name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Email cannot be changed</p>
            </div>
          </CardContent>
        </Card>

        {/* Appearance Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Moon className="text-primary-600 dark:text-primary-400" size={20} />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Appearance</h2>
            </div>
          </CardHeader>
          <CardContent>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Theme
            </label>
            <div className="grid grid-cols-3 gap-3">
              <ThemeOption value="light" label="Light" icon={Sun} />
              <ThemeOption value="dark" label="Dark" icon={Moon} />
              <ThemeOption value="system" label="System" icon={Monitor} />
            </div>
          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="text-primary-600 dark:text-primary-400" size={20} />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Push Notifications</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Receive notifications for reminders and updates</p>
              </div>
              <button
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  notificationsEnabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    notificationsEnabled ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Daily Reminder</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Get reminded to study every day</p>
              </div>
              <button
                onClick={() => setDailyReminder(!dailyReminder)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  dailyReminder ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    dailyReminder ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {dailyReminder && (
              <div className="ml-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reminder Time
                </label>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Sound Effects</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Play sounds for correct/incorrect answers</p>
              </div>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  soundEnabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    soundEnabled ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Data Management Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Download className="text-primary-600 dark:text-primary-400" size={20} />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Export / Import</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FileJson className="text-primary-600 dark:text-primary-400" size={20} />
                  <p className="font-medium text-gray-900 dark:text-white">Export Data</p>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Download your progress, quiz history, and settings</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleExportJSON} isLoading={isExporting}>
                    <Download size={14} className="mr-1" />
                    JSON
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleExportCSV} isLoading={isExporting}>
                    <Download size={14} className="mr-1" />
                    CSV
                  </Button>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Upload className="text-primary-600 dark:text-primary-400" size={20} />
                  <p className="font-medium text-gray-900 dark:text-white">Import Deck</p>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Import a custom vocabulary deck (JSON)</p>
                <label className="cursor-pointer inline-block">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportDeck}
                    className="hidden"
                    disabled={isImporting}
                  />
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                    <Upload size={14} className="mr-1" />
                    {isImporting ? 'Importing...' : 'Select File'}
                  </span>
                </label>
                {importMessage && (
                  <p className={`text-sm mt-2 ${importMessage.includes('success') || importMessage.includes('Successfully') ? 'text-green-600' : 'text-red-600'}`}>
                    {importMessage}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clear Data Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trash2 className="text-red-600 dark:text-red-400" size={20} />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Clear Data</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Clear Learning Progress</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Delete all your progress, quiz history, and game scores</p>
              </div>
              <Button variant="danger" size="sm" onClick={handleClearData}>
                Clear Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex items-center gap-4">
          <Button onClick={handleSaveProfile} isLoading={isSaving}>
            <Save className="mr-2" size={18} />
            Save Settings
          </Button>
          {saveMessage && (
            <span className={`text-sm ${saveMessage.includes('Failed') ? 'text-red-600' : 'text-green-600'}`}>
              {saveMessage}
            </span>
          )}
        </div>

        {/* Logout */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="ghost" onClick={logout}>
            <LogOut className="mr-2" size={18} />
            Sign Out
          </Button>
        </div>
      </div>
    </Layout>
  );
};
