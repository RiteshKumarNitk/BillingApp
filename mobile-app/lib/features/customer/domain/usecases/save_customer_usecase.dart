import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failure.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/customer.dart';
import '../repositories/customer_repository.dart';

class SaveCustomerUseCase extends UseCase<void, Customer> {
  final ICustomerRepository repository;

  SaveCustomerUseCase(this.repository);

  @override
  Future<Either<Failure, void>> call(Customer customer) async {
    try {
      await repository.saveCustomer(customer);
      return const Right(null);
    } catch (e) {
      return Left(CacheFailure(e.toString()));
    }
  }
}
