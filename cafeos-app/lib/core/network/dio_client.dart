import 'package:dio/dio.dart';
import '../storage/secure_storage_service.dart';
import '../utils/app_constants.dart';

/// The one Dio instance the whole app shares, pre-wired with the auth header and shared timeouts —
/// replaces mobile-app/'s hand-rolled `ApiClient` God-class (one Future per endpoint, no
/// interceptor, base URL hardcoded twice in two different files). Feature datasources take this
/// via DI and call `.get`/`.post`/etc. directly; auth-failure handling (401 → clear token) lives
/// here once instead of being duplicated per call site.
class DioClient {
  final Dio dio;
  final SecureStorageService _secureStorage;

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
          if (error.response?.statusCode == 401) {
            // Token is invalid/expired/revoked — drop it so the next auth check routes to login
            // instead of silently retrying with a dead token.
            await _secureStorage.clearToken();
          }
          handler.next(error);
        },
      ),
    );
  }
}
