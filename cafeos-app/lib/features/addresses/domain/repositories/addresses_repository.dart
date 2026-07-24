import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failure.dart';
import '../entities/customer_address.dart';

abstract class AddressesRepository {
  Future<Either<Failure, List<CustomerAddress>>> getAddresses();

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
  });

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
  });

  Future<Either<Failure, Unit>> deleteAddress(String id);
}
