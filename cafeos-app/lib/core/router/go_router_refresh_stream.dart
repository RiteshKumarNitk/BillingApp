import 'dart:async';
import 'package:flutter/foundation.dart';

/// Bridges a Cubit's state Stream to go_router's `refreshListenable`, so the router re-evaluates
/// `redirect:` every time auth state changes (login/logout/guest) instead of only on navigation.
class GoRouterRefreshStream extends ChangeNotifier {
  late final StreamSubscription<dynamic> _subscription;

  GoRouterRefreshStream(Stream<dynamic> stream) {
    notifyListeners();
    _subscription = stream.asBroadcastStream().listen((_) => notifyListeners());
  }

  @override
  void dispose() {
    _subscription.cancel();
    super.dispose();
  }
}
