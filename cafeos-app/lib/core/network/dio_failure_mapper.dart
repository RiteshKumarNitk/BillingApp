import 'package:dio/dio.dart';
import '../error/failure.dart';

/// Every repository's try/catch funnels a DioException through this once, instead of each one
/// hand-rolling its own error-message logic (mobile-app/'s `ApiClient._handleResponse` just threw
/// a bare `Exception(message)` — no failure-type distinction between "you're offline" and "the
/// server rejected this").
Failure mapDioExceptionToFailure(DioException e) {
  switch (e.type) {
    case DioExceptionType.connectionTimeout:
    case DioExceptionType.sendTimeout:
    case DioExceptionType.receiveTimeout:
    case DioExceptionType.connectionError:
    case DioExceptionType.transformTimeout:
      return const NetworkFailure();
    case DioExceptionType.badResponse:
      final statusCode = e.response?.statusCode;
      final data = e.response?.data;
      final serverMessage = data is Map && data['error'] is String ? data['error'] as String : null;
      if (statusCode == 401) {
        return UnauthorizedFailure(serverMessage ?? 'Your session has expired. Please sign in again.');
      }
      return ServerFailure(serverMessage ?? 'Something went wrong. Please try again.', statusCode: statusCode);
    case DioExceptionType.cancel:
      return const ServerFailure('Request was cancelled.');
    case DioExceptionType.badCertificate:
    case DioExceptionType.unknown:
      return const NetworkFailure();
  }
}
