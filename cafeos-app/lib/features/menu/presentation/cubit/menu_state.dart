import 'package:equatable/equatable.dart';
import '../../domain/entities/menu_item.dart';

enum MenuStatus { initial, loading, loaded, error }

class MenuState extends Equatable {
  final MenuStatus status;
  final List<MenuCategory> categories;
  final String? errorMessage;
  final String? selectedCategory;

  const MenuState({
    this.status = MenuStatus.initial,
    this.categories = const [],
    this.errorMessage,
    this.selectedCategory,
  });

  List<MenuCategory> get visibleCategories {
    if (selectedCategory == null) return categories;
    return categories.where((c) => c.category == selectedCategory).toList();
  }

  MenuState copyWith({MenuStatus? status, List<MenuCategory>? categories, String? errorMessage, String? selectedCategory, bool clearSelectedCategory = false}) {
    return MenuState(
      status: status ?? this.status,
      categories: categories ?? this.categories,
      errorMessage: errorMessage,
      selectedCategory: clearSelectedCategory ? null : (selectedCategory ?? this.selectedCategory),
    );
  }

  @override
  List<Object?> get props => [status, categories, errorMessage, selectedCategory];
}
