import React, { useState, useEffect } from 'react';
import { Smartphone, Tablet, Monitor, Check, Share2, Download, ExternalLink } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card, CardContent, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';

interface WidgetInfo {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  platform: 'pwa' | 'ios' | 'android';
  steps: string[];
}

const widgetFeatures: WidgetInfo[] = [
  {
    id: 'pwa',
    title: 'PWA Home Screen',
    description: 'Add Nihongo Flash to your home screen for instant access',
    icon: <Monitor className="w-8 h-8" />,
    platform: 'pwa',
    steps: [
      'Open Nihongo Flash in Chrome or Safari',
      'Tap the share/menu button in your browser',
      'Select "Add to Home Screen"',
      'The app will appear alongside your other apps'
    ]
  },
  {
    id: 'ios-shortcuts',
    title: 'iOS Shortcuts',
    description: 'Create quick action shortcuts for instant access to features',
    icon: <Smartphone className="w-8 h-8" />,
    platform: 'ios',
    steps: [
      'Open the Shortcuts app on your iPhone',
      'Tap "+" to create a new shortcut',
      'Search for "Open URL"',
      'Enter: https://your-app-url.com',
      'Add icon and name',
      'Add to Home Screen for quick access'
    ]
  },
  {
    id: 'ios-widget',
    title: 'iOS Home Screen Widgets',
    description: 'Track your learning progress directly from the home screen',
    icon: <Tablet className="w-8 h-8" />,
    platform: 'ios',
    steps: [
      'Long press on your home screen',
      'Tap the "+" in the top left corner',
      'Search for "Nihongo Flash" (requires iOS 14+)',
      'Select widget size (small, medium, large)',
      'Add to home screen'
    ]
  },
  {
    id: 'android-widget',
    title: 'Android Widgets',
    description: 'Add learning widgets to your Android home screen',
    icon: <Smartphone className="w-8 h-8" />,
    platform: 'android',
    steps: [
      'Open Nihongo Flash in Chrome on Android',
      'Tap "Install App" or "Add to Home Screen"',
      'Long press on your home screen',
      'Select "Widgets"',
      'Find "Nihongo Flash"',
      'Choose widget size and place on screen'
    ]
  }
];

export const WidgetsPage: React.FC = () => {
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);

  useEffect(() => {
    const checkPWA = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsInstalled(isStandalone || isInWebAppiOS);
    };

    checkPWA();

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
    });

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    return () => {
      window.removeEventListener('appinstalled', () => {});
    };
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      await (deferredPrompt as unknown as { prompt: () => Promise<void> }).prompt();
      const { outcome } = await (deferredPrompt as unknown as { userChoice: Promise<{ outcome: string }> }).userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  const shareApp = async () => {
    const shareData = {
      title: 'Nihongo Flash - Learn Japanese',
      text: 'Check out Nihongo Flash - the best way to learn Japanese!',
      url: window.location.origin
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      await navigator.clipboard.writeText(shareData.url);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Widgets & Installation
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Get the full Nihongo Flash experience on your device
          </p>
        </div>

        {isInstalled && (
          <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Check className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">
                    App Installed
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Nihongo Flash is installed on your device
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!isInstalled && deferredPrompt && (
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Download className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-800 dark:text-blue-200">
                      Install App
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Get the full app experience
                    </p>
                  </div>
                </div>
                <Button onClick={handleInstallPWA}>
                  Install
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {widgetFeatures.map((widget) => (
            <Card key={widget.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <h3 className="text-lg font-semibold flex items-center gap-3">
                  <span className="text-orange-500">{widget.icon}</span>
                  {widget.title}
                </h3>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {widget.description}
                </p>
                <div className="space-y-2">
                  {widget.steps.map((step, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <span className="text-gray-700 dark:text-gray-300">{step}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Quick Actions
            </h3>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Add quick access shortcuts to your home screen for instant access to your favorite features.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                variant="outline"
                onClick={() => window.location.href = '/quick-review'}
                className="justify-start"
              >
                <Monitor className="w-4 h-4 mr-2" />
                Quick Review
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/daily-challenge'}
                className="justify-start"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Daily Challenge
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/kanji'}
                className="justify-start"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Study Kanji
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/grammar'}
                className="justify-start"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Grammar Lessons
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Share Nihongo Flash</h3>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Share the app with friends and start learning together!
            </p>
            <Button onClick={shareApp}>
              <Share2 className="w-4 h-4 mr-2" />
              Share App
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};
