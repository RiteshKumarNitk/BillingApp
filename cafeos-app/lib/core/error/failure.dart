import 'package:equatable/equatable.dart';

/// Base failure type returned by repositories on the left side of an `Either<Failure, T>` —
/// mirrors the pattern already used by mobile-app/'s staff features (lib/core/error/failure.dart
/// there only had one concrete subtype implemented; this fills in the ones a networked app
/// actually needs).
abstract class Failure extends Equatable {
  final String message;
  const Failure(this.message);

  @override
  List<Object?> get props => [message];
}

class ServerFailure extends Failure {
  final int? statusCode;
  const ServerFailure(super.message, {this.statusCode});
}

class NetworkFailure extends Failure {
  const NetworkFailure([super.message = 'No internet connection. Check your network and try again.']);
}

class UnauthorizedFailure extends Failure {
  const UnauthorizedFailure([super.message = 'Your session has expired. Please sign in again.']);
}

class CacheFailure extends Failure {
  const CacheFailure([super.message = 'Something went wrong reading local data.']);
}

class ValidationFailure extends Failure {
  const ValidationFailure(super.message);
}

class LocationFailure extends Failure {
  const LocationFailure(super.message);
}
