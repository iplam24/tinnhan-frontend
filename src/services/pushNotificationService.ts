// Service to handle Web Push Notifications
// Note: Requires backend implementation to send the actual push messages

const VAPID_PUBLIC_KEY = 'YOUR_VAPID_PUBLIC_KEY_HERE';

export const pushNotificationService = {
  async subscribeUser() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications are not supported by this browser');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Check for existing subscription
      let subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        return subscription;
      }

      // If no subscription, create one
      // You must generate VAPID keys and put the public one here
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      console.log('User is subscribed:', subscription);
      // TODO: Send this subscription object to your backend to store it
      // await api.post('/push/subscribe', subscription);
      
      return subscription;
    } catch (err) {
      console.error('Failed to subscribe the user: ', err);
    }
  }
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
