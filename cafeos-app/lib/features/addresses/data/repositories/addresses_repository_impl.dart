import 'package:dio/dio.dart';
import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failure.dart';
import '../../../../core/network/dio_failure_mapper.dart';
import '../../domain/entities/customer_address.dart';
import '../../domain/repositories/addresses_repository.dart';
import '../datasources/addresses_remote_datasource.dart';

class AddressesRepositoryImpl implements AddressesRepository {
  final AddressesRemoteDataSource remoteDataSource;
  AddressesRepositoryImpl(this.remoteDataSource);

  @override
  Future<Either<Failure, List<CustomerAddress>>> getAddresses() async {
    try {
      return right(await remoteDataSource.getAddresses());
    } on DioException catch (e) {
      return left(mapDioExceptionToFailure(e));
    }
  }

  @override
  Future<Either<Failure, CustomerAddress>> createAddress({
    String? label,
    required String fullAddress,
    String? landmark,
    String? city,
    String? state,
    String? postalCode,
    double? latitude,
    double? longitude,
    bool? isDefault,
  }) async {
    try {
      final address = await remoteDataSource.createAddress(
        label: label,
        fullAddress: fullAddress,
        landmark: landmark,
        city: city,
        state: state,
        postalCode: postalCode,
        latitude: latitude,
        longitude: longitude,
        isDefault: isDefault,
      );
      return right(address);
    } on DioException catch (e) {
      return left(mapDioExceptionToFailure(e));
    }
  }

  @override
  Future<Either<Failure, CustomerAddress>> updateAddress({
    required String id,
    String? label,
    String? fullAddress,
    String? landmark,
    String? city,
    String? state,
    String? postalCode,
    double? latitude,
    double? longitude,
    bool? isDefault,
  }) async {
    try {
      final address = await remoteDataSource.updateAddress(
        id: id,
        label: label,
        fullAddress: fullAddress,
        landmark: landmark,
        city: city,
        state: state,
        postalCode: postalCode,
        latitude: latitude,
        longitude: longitude,
        isDefault: isDefault,
      );
      return right(address);
    } on DioException catch (e) {
      return left(mapDioExceptionToFailure(e));
    }
  }

  @override
  Future<Either<Failure, Unit>> deleteAddress(String id) async {
    try {
      await remoteDataSource.deleteAddress(id);
      return right(unit);
    } on DioException catch (e) {
      return left(mapDioExceptionToFailure(e));
    }
  }
}
