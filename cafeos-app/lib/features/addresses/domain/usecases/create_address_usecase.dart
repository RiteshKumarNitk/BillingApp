import 'package:equatable/equatable.dart';
import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failure.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/customer_address.dart';
import '../repositories/addresses_repository.dart';

class CreateAddressParams extends Equatable {
  final String? label;
  final String fullAddress;
  final String? landmark;
  final String? city;
  final String? state;
  final String? postalCode;
  final double? latitude;
  final double? longitude;
  final bool? isDefault;

  const CreateAddressParams({
    this.label,
    required this.fullAddress,
    this.landmark,
    this.city,
    this.state,
    this.postalCode,
    this.latitude,
    this.longitude,
    this.isDefault,
  });

  @override
  List<Object?> get props => [label, fullAddress, landmark, city, state, postalCode, latitude, longitude, isDefault];
}

class CreateAddressUseCase implements UseCase<CustomerAddress, CreateAddressParams> {
  final AddressesRepository repository;
  const CreateAddressUseCase(this.repository);

  @override
  Future<Either<Failure, CustomerAddress>> call(CreateAddressParams params) {
    return repository.createAddress(
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
