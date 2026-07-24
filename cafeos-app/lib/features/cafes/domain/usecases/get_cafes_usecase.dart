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
  // Backend defaults to 30, max 100 — the Map tab passes 100 so it can plot every active cafe
  // instead of just the first page.
  final int? limit;
  const GetCafesParams({this.lat, this.lng, this.search, this.sort, this.limit});

  @override
  List<Object?> get props => [lat, lng, search, sort, limit];
}

class GetCafesUseCase implements UseCase<List<Cafe>, GetCafesParams> {
  final CafesRepository repository;
  GetCafesUseCase(this.repository);

  @override
  Future<Either<Failure, List<Cafe>>> call(GetCafesParams params) {
    return repository.getCafes(lat: params.lat, lng: params.lng, search: params.search, sort: params.sort, limit: params.limit);
  }
}
