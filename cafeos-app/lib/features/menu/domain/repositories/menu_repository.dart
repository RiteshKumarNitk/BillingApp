import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failure.dart';
import '../entities/menu_item.dart';

abstract class MenuRepository {
  Future<Either<Failure, List<MenuCategory>>> getMenu({required String tenantId, String? search});
}
