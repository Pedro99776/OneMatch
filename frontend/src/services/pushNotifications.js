import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import api from './api';

/**
 * Inicializa push notifications no dispositivo nativo.
 * - Pede permissão ao usuário
 * - Registra no FCM (Android) / APNs (iOS)
 * - Envia o token para o backend Django
 * - Trata notificações recebidas e tap
 */
export async function initPushNotifications() {
  // Push notifications só funcionam em plataformas nativas
  if (!Capacitor.isNativePlatform()) return;

  try {
    // Verifica/pede permissão
    let permission = await PushNotifications.checkPermissions();

    if (permission.receive === 'prompt') {
      permission = await PushNotifications.requestPermissions();
    }

    if (permission.receive !== 'granted') {
      console.log('Push notifications permission not granted');
      return;
    }

    // Registra no FCM/APNs
    await PushNotifications.register();

    // Listener: token de registro recebido
    PushNotifications.addListener('registration', async (token) => {
      console.log('Push registration token:', token.value);
      try {
        await registerDeviceToken(token.value, Capacitor.getPlatform());
      } catch (err) {
        console.error('Failed to register device token:', err);
      }
    });

    // Listener: erro no registro
    PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error:', error);
    });

    // Listener: notificação recebida com app em foreground
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received in foreground:', notification);
      // Pode adicionar um toast/banner aqui no futuro
    });

    // Listener: usuário clicou na notificação
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push notification tapped:', notification);
      const data = notification.notification.data;

      if (data?.type === 'match_created' || data?.type === 'new_message') {
        window.location.href = '/chat';
      }
    });
  } catch (err) {
    console.error('Failed to initialize push notifications:', err);
  }
}

/**
 * Envia o device token para o backend Django para armazenamento.
 */
async function registerDeviceToken(token, platform) {
  return api.post('/api/auth/device-token/', { token, platform });
}
