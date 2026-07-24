import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failure.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/customer_address.dart';
import '../repositories/addresses_repository.dart';

class GetAddressesUseCase implements UseCase<List<CustomerAddress>, NoParams> {
  final AddressesRepository repository;
  const GetAddressesUseCase(this.repository);

  @override
  Future<Either<Failure, List<CustomerAddress>>> call(NoParams params) => repository.getAddresses();
}
