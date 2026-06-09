import 'dart:convert';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;

/// Top-level background message handler (must be a top-level function)
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  debugPrint('FCM Background message: ${message.messageId}');
}

class FcmService {
  static const String _baseUrl = 'https://billing-app-jade-beta.vercel.app/api/mobile';
  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();
  static int _notificationId = 0;

  static final FcmService _instance = FcmService._();
  factory FcmService() => _instance;
  FcmService._();

  /// Initialize FCM: request permissions, get token, set up handlers
  Future<void> initialize() async {
    try {
      // Register background handler
      FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

      // Request notification permissions
      final settings = await _messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );

      if (settings.authorizationStatus != AuthorizationStatus.authorized) {
        debugPrint('FCM: Notification permission denied');
        return;
      }

      // Initialize local notifications for foreground display
      await _initLocalNotifications();

      // Get and save FCM token
      final token = await _messaging.getToken();
      if (token != null) {
        debugPrint('FCM Token: $token');
        await _saveTokenToServer(token);
      }

      // Listen for token refresh
      _messaging.onTokenRefresh.listen((newToken) {
        debugPrint('FCM Token refreshed: $newToken');
        _saveTokenToServer(newToken);
      });

      // Handle foreground messages
      FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

      // Handle notification tap when app is in background
      FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);

      // Handle notification tap when app was terminated
      final initialMessage = await _messaging.getInitialMessage();
      if (initialMessage != null) {
        _handleNotificationTap(initialMessage);
      }
    } catch (e) {
      debugPrint('FCM initialization error: $e');
    }
  }

  Future<void> _initLocalNotifications() async {
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: false,
      requestBadgePermission: false,
      requestSoundPermission: false,
    );
    const initSettings = InitializationSettings(android: androidSettings, iOS: iosSettings);

    await _localNotifications.initialize(
      settings: initSettings,
      onDidReceiveNotificationResponse: (details) {
        if (details.payload != null) {
          try {
            final data = json.decode(details.payload!);
            _handleNotificationPayload(data);
          } catch (_) {}
        }
      },
    );

    // Create Android notification channel
    const androidChannel = AndroidNotificationChannel(
      'order_updates',
      'Order Updates',
      description: 'Notifications about your order status',
      importance: Importance.high,
    );
    await _localNotifications
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(androidChannel);
  }

  void _handleForegroundMessage(RemoteMessage message) {
    debugPrint('FCM Foreground message: ${message.notification?.title}');

    final notification = message.notification;
    if (notification != null) {
      _localNotifications.show(
        id: _notificationId++,
        title: notification.title,
        body: notification.body,
        notificationDetails: const NotificationDetails(
          android: AndroidNotificationDetails(
            'order_updates',
            'Order Updates',
            channelDescription: 'Notifications about your order status',
            importance: Importance.high,
            priority: Priority.high,
          ),
          iOS: DarwinNotificationDetails(
            presentAlert: true,
            presentBadge: true,
            presentSound: true,
          ),
        ),
        payload: json.encode(message.data),
      );
    }
  }

  void _handleNotificationTap(RemoteMessage message) {
    debugPrint('FCM Notification tapped: ${message.data}');
    _handleNotificationPayload(message.data);
  }

  void _handleNotificationPayload(Map<String, dynamic> data) {
    final type = data['type'];
    final orderId = data['orderId'];
    debugPrint('Navigate from push: type=$type, orderId=$orderId');
  }

  Future<void> _saveTokenToServer(String token) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final customerToken = prefs.getString('customer_token');
      if (customerToken == null) return;

      await http.post(
        Uri.parse('$_baseUrl/customer/fcm-token'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $customerToken',
        },
        body: json.encode({'fcmToken': token}),
      );
    } catch (e) {
      debugPrint('Error saving FCM token: $e');
    }
  }

  /// Remove FCM token from server (call on logout)
  Future<void> removeTokenFromServer() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final customerToken = prefs.getString('customer_token');
      if (customerToken == null) return;

      await http.delete(
        Uri.parse('$_baseUrl/customer/fcm-token'),
        headers: {'Authorization': 'Bearer $customerToken'},
      );
    } catch (e) {
      debugPrint('Error removing FCM token: $e');
    }
  }
}
