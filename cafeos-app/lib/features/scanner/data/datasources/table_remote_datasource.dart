import 'package:dio/dio.dart';
import '../../../../core/utils/app_constants.dart';

class TableRemoteDataSource {
  final Dio dio;
  TableRemoteDataSource(this.dio);

  /// A full URL, not a `/customer/...` path — GET /api/website/table lives outside the
  /// `/api/mobile` prefix the shared Dio's baseUrl points at, so this overrides it per-call.
  Future<String?> validateTable({required String tenantId, required String token}) async {
    final response = await dio.get(
      '${AppConstants.websiteApiBaseUrl}/table',
      queryParameters: {'tenantId': tenantId, 'token': token},
    );
    final data = response.data as Map<String, dynamic>;
    final valid = data['valid'] as bool? ?? false;
    return valid ? data['label'] as String? : null;
  }
}
