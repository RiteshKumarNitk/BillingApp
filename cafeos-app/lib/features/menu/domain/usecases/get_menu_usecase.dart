import 'package:equatable/equatable.dart';
import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failure.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/menu_item.dart';
import '../repositories/menu_repository.dart';

class GetMenuParams extends Equatable {
  final String tenantId;
  final String? search;
  const GetMenuParams({required this.tenantId, this.search});

  @override
  List<Object?> get props => [tenantId, search];
}

class GetMenuUseCase implements UseCase<List<MenuCategory>, GetMenuParams> {
  final MenuRepository repository;
  const GetMenuUseCase(this.repository);

  @override
  Future<Either<Failure, List<MenuCategory>>> call(GetMenuParams params) {
    return repository.getMenu(tenantId: params.tenantId, search: params.search);
  }
}
