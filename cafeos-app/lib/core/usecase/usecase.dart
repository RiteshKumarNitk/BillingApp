import 'package:fpdart/fpdart.dart';
import '../error/failure.dart';

/// Contract every usecase implements: `Params` in, `Either<Failure, Result>` out. Matches
/// mobile-app/'s staff-feature usecase pattern (lib/core/usecase/usecase.dart there).
abstract class UseCase<Result, Params> {
  Future<Either<Failure, Result>> call(Params params);
}

/// For usecases that take no parameters.
class NoParams {
  const NoParams();
}
