import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/usecases/get_menu_usecase.dart';
import 'menu_state.dart';

class MenuCubit extends Cubit<MenuState> {
  final GetMenuUseCase _getMenuUseCase;
  final String tenantId;

  MenuCubit({required GetMenuUseCase getMenuUseCase, required this.tenantId})
      : _getMenuUseCase = getMenuUseCase,
        super(const MenuState());

  Future<void> loadMenu() async {
    emit(state.copyWith(status: MenuStatus.loading));
    final result = await _getMenuUseCase(GetMenuParams(tenantId: tenantId));
    result.match(
      (failure) => emit(state.copyWith(status: MenuStatus.error, errorMessage: failure.message)),
      (categories) => emit(state.copyWith(status: MenuStatus.loaded, categories: categories)),
    );
  }

  void selectCategory(String? category) => emit(state.copyWith(selectedCategory: category, clearSelectedCategory: category == null));

  void toggleFeaturedOnly() => emit(state.copyWith(featuredOnly: !state.featuredOnly));
}
