import 'package:equatable/equatable.dart';
import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failure.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/customer_address.dart';
import '../repositories/addresses_repository.dart';

class UpdateAddressParams extends Equatable {
  final String id;
  final String? label;
  final String? fullAddress;
  final String? landmark;
  final String? city;
  final String? state;
  final String? postalCode;
  final double? latitude;
  final double? longitude;
  final bool? isDefault;

  const UpdateAddressParams({
    required this.id,
    this.label,
    this.fullAddress,
    this.landmark,
    this.city,
    this.state,
    this.postalCode,
    this.latitude,
    this.longitude,
    this.isDefault,
  });

  @override
  List<Object?> get props => [id, label, fullAddress, landmark, city, state, postalCode, latitude, longitude, isDefault];
}

class UpdateAddressUseCase implements UseCase<CustomerAddress, UpdateAddressParams> {
  final AddressesRepository repository;
  const UpdateAddressUseCase(this.repository);

  @override
  Future<Either<Failure, CustomerAddress>> call(UpdateAddressParams params) {
    return repository.updateAddress(
      id: params.id,
      label: params.label,
      fullAddress: params.fullAddress,
      landmark: params.landmark,
      city: params.city,
      state: params.state,
      postalCode: params.postalCode,
      latitude: params.latitude,
      longitude: params.longitude,
      isDefault: params.isDefault,
    );
  }
}
