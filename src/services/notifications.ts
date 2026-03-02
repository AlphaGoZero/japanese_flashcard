export const notificationService = {
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return Notification.permission;
  },

  async showNotification(title: string, options?: NotificationOptions) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    try {
      const notification = new Notification(title, {
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-72.png',
        ...options,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return notification;
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  },

  async scheduleDailyReminder(hour = 9, minute = 0) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      console.log('Notifications not available');
      return;
    }

    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hour, minute, 0, 0);

    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const delay = scheduledTime.getTime() - now.getTime();

    setTimeout(() => {
      this.showNotification('Time to study! 🌸', {
        body: 'Keep your Japanese learning streak going!',
        tag: 'daily-reminder',
      });
      
      this.scheduleDailyReminder(hour, minute);
    }, delay);
  },

  async showStudyReminder(cardsDue: number) {
    if (cardsDue > 0) {
      await this.showNotification('Cards to review 📚', {
        body: `You have ${cardsDue} cards waiting for review!`,
        tag: 'study-reminder',
      });
    }
  }
};
