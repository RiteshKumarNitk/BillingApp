import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failure.dart';
import '../entities/cafe.dart';

abstract class CafesRepository {
  Future<Either<Failure, List<Cafe>>> getCafes({double? lat, double? lng, String? search});
}
