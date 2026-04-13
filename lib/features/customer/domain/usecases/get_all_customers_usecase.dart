import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failure.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/customer.dart';
import '../repositories/customer_repository.dart';

class GetAllCustomersUseCase extends UseCase<List<Customer>, NoParams> {
  final ICustomerRepository repository;

  GetAllCustomersUseCase(this.repository);

  @override
  Future<Either<Failure, List<Customer>>> call(NoParams params) async {
    try {
      final customers = await repository.getAllCustomers();
      return Right(customers);
    } catch (e) {
      return Left(CacheFailure(e.toString()));
    }
  }
}
