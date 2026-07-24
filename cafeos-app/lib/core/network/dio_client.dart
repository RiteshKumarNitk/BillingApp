import 'package:dio/dio.dart';
import '../storage/secure_storage_service.dart';
import '../utils/app_constants.dart';

/// The one Dio instance the whole app shares, pre-wired with the auth header and shared timeouts —
/// replaces mobile-app/'s hand-rolled `ApiClient` God-class (one Future per endpoint, no
/// interceptor, base URL hardcoded twice in two different files). Feature datasources take this
/// via DI and call `.get`/`.post`/etc. directly; auth-failure handling (401 → refresh-and-retry,
/// else clear token) lives here once instead of being duplicated per call site.
class DioClient {
  final Dio dio;
  final SecureStorageService _secureStorage;
  bool _isRefreshing = false;

  DioClient(this._secureStorage)
      : dio = Dio(
          BaseOptions(
            baseUrl: AppConstants.apiBaseUrl,
            connectTimeout: AppConstants.networkTimeout,
            receiveTimeout: AppConstants.networkTimeout,
            headers: {'Content-Type': 'application/json'},
          ),
        ) {
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _secureStorage.getToken();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          final path = error.requestOptions.path;
          // Auth endpoints (login/register/refresh itself/forgot/reset-password) never get a
          // refresh-and-retry — a 401 from one of these means "bad credentials"/"already revoked",
          // not "session expired mid-use", and retrying would just loop.
          final isAuthEndpoint = path.contains('/customer/auth/');

          if (error.response?.statusCode == 401 && !isAuthEndpoint && !_isRefreshing) {
            _isRefreshing = true;
            try {
              final currentToken = await _secureStorage.getToken();
              if (currentToken != null) {
                final refreshResponse = await dio.post('/customer/auth/refresh');
                final newToken = (refreshResponse.data as Map<String, dynamic>)['token'] as String;
                await _secureStorage.saveToken(newToken);

                final retryOptions = error.requestOptions;
                retryOptions.headers['Authorization'] = 'Bearer $newToken';
                _isRefreshing = false;
                final retryResponse = await dio.fetch(retryOptions);
                return handler.resolve(retryResponse);
              }
            } catch (_) {
              // Refresh failed too (token already revoked/expired) — fall through and clear it.
            }
            _isRefreshing = false;
          }

          if (error.response?.statusCode == 401) {
            // Token is invalid/expired/revoked and couldn't be refreshed — drop it so the next
            // auth check routes to login instead of silently retrying with a dead token.
            await _secureStorage.clearToken();
          }
          handler.next(error);
        },
      ),
    );
  }
}
