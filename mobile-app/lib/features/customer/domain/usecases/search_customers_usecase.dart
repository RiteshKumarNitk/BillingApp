import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failure.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/customer.dart';
import '../repositories/customer_repository.dart';

class SearchCustomersUseCase extends UseCase<List<Customer>, String> {
  final ICustomerRepository repository;

  SearchCustomersUseCase(this.repository);

  @override
  Future<Either<Failure, List<Customer>>> call(String query) async {
    try {
      if (query.isEmpty) {
        return Left(CacheFailure('Search query cannot be empty'));
      }
      final customers = await repository.searchCustomers(query);
      return Right(customers);
    } catch (e) {
      return Left(CacheFailure(e.toString()));
    }
  }
}
