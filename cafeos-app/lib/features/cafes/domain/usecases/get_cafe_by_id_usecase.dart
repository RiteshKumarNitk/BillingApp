import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failure.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/cafe.dart';
import '../repositories/cafes_repository.dart';

class GetCafeByIdUseCase implements UseCase<Cafe, String> {
  final CafesRepository repository;
  const GetCafeByIdUseCase(this.repository);

  @override
  Future<Either<Failure, Cafe>> call(String id) => repository.getCafeById(id);
}
