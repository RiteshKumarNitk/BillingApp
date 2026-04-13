import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failure.dart';
import '../../../../core/usecase/usecase.dart';
import '../../domain/entities/transaction.dart';
import '../../domain/repositories/transaction_repository.dart';

class SaveTransactionUseCase extends UseCase<void, Transaction> {
  final TransactionRepository repository;

  SaveTransactionUseCase(this.repository);

  @override
  Future<Either<Failure, void>> call(Transaction params) async {
    try {
      await repository.saveTransaction(params);
      return const Right(null);
    } catch (e) {
      return Left(CacheFailure('Failed to save transaction: $e'));
    }
  }
}

class GetAllTransactionsUseCase extends UseCase<List<Transaction>, NoParams> {
  final TransactionRepository repository;

  GetAllTransactionsUseCase(this.repository);

  @override
  Future<Either<Failure, List<Transaction>>> call(NoParams params) async {
    try {
      final transactions = await repository.getAllTransactions();
      return Right(transactions);
    } catch (e) {
      return Left(CacheFailure('Failed to get transactions: $e'));
    }
  }
}

class GetTransactionsByDateUseCase extends UseCase<List<Transaction>, DateTime> {
  final TransactionRepository repository;

  GetTransactionsByDateUseCase(this.repository);

  @override
  Future<Either<Failure, List<Transaction>>> call(DateTime date) async {
    try {
      final transactions = await repository.getTransactionsByDate(date);
      return Right(transactions);
    } catch (e) {
      return Left(CacheFailure('Failed to get transactions: $e'));
    }
  }
}

class RefundTransactionUseCase extends UseCase<void, String> {
  final TransactionRepository repository;

  RefundTransactionUseCase(this.repository);

  @override
  Future<Either<Failure, void>> call(String transactionId) async {
    try {
      await repository.refundTransaction(transactionId);
      return const Right(null);
    } catch (e) {
      return Left(CacheFailure('Failed to refund transaction: $e'));
    }
  }
}

class GetDailySalesUseCase extends UseCase<double, DateTime> {
  final TransactionRepository repository;

  GetDailySalesUseCase(this.repository);

  @override
  Future<Either<Failure, double>> call(DateTime date) async {
    try {
      final sales = await repository.getDailySales(date);
      return Right(sales);
    } catch (e) {
      return Left(CacheFailure('Failed to get daily sales: $e'));
    }
  }
}
