import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failure.dart';
import '../../../../core/usecase/usecase.dart';
import '../repositories/addresses_repository.dart';

class DeleteAddressUseCase implements UseCase<Unit, String> {
  final AddressesRepository repository;
  const DeleteAddressUseCase(this.repository);

  @override
  Future<Either<Failure, Unit>> call(String id) => repository.deleteAddress(id);
}
