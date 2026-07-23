import 'package:equatable/equatable.dart';
import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failure.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/cafe.dart';
import '../repositories/cafes_repository.dart';

class GetCafesParams extends Equatable {
  final double? lat;
  final double? lng;
  final String? search;
  final String? sort;
  const GetCafesParams({this.lat, this.lng, this.search, this.sort});

  @override
  List<Object?> get props => [lat, lng, search, sort];
}

class GetCafesUseCase implements UseCase<List<Cafe>, GetCafesParams> {
  final CafesRepository repository;
  GetCafesUseCase(this.repository);

  @override
  Future<Either<Failure, List<Cafe>>> call(GetCafesParams params) {
    return repository.getCafes(lat: params.lat, lng: params.lng, search: params.search, sort: params.sort);
  }
}
