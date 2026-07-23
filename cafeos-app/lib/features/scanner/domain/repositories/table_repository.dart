import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failure.dart';

abstract class TableRepository {
  /// Re-validates a scanned table QR token against the tenant it claims to belong to (mirrors the
  /// public GET /api/website/table the website itself uses) — never trust the QR payload alone.
  /// Returns the table's display label if valid.
  Future<Either<Failure, String>> validateTable({required String tenantId, required String token});
}
