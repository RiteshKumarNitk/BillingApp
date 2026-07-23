import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../utils/app_constants.dart';

/// Holds the customer bearer token. Encrypted-at-rest storage (Keychain on iOS, EncryptedSharedPreferences
/// on Android) — mobile-app/ stored its equivalent token in plain shared_preferences, which is
/// readable by any code/tooling with access to the app's sandbox; a 30-day bearer token deserves
/// better than that.
class SecureStorageService {
  final FlutterSecureStorage _storage;

  SecureStorageService({FlutterSecureStorage? storage})
      : _storage = storage ?? const FlutterSecureStorage();

  Future<void> saveToken(String token) => _storage.write(key: AppConstants.secureStorageTokenKey, value: token);

  Future<String?> getToken() => _storage.read(key: AppConstants.secureStorageTokenKey);

  Future<void> clearToken() => _storage.delete(key: AppConstants.secureStorageTokenKey);
}
