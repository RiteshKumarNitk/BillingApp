import 'package:equatable/equatable.dart';
import '../../domain/entities/menu_item.dart';

enum MenuStatus { initial, loading, loaded, error }

class MenuState extends Equatable {
  final MenuStatus status;
  final List<MenuCategory> categories;
  final String? errorMessage;
  final String? selectedCategory;
  final bool featuredOnly;

  const MenuState({
    this.status = MenuStatus.initial,
    this.categories = const [],
    this.errorMessage,
    this.selectedCategory,
    this.featuredOnly = false,
  });

  bool get hasFeaturedItems => categories.any((c) => c.items.any((i) => i.isFeatured));

  List<MenuCategory> get visibleCategories {
    var result = selectedCategory == null ? categories : categories.where((c) => c.category == selectedCategory).toList();
    if (featuredOnly) {
      result = result
          .map((c) => MenuCategory(category: c.category, items: c.items.where((i) => i.isFeatured).toList()))
          .where((c) => c.items.isNotEmpty)
          .toList();
    }
    return result;
  }

  MenuState copyWith({
    MenuStatus? status,
    List<MenuCategory>? categories,
    String? errorMessage,
    String? selectedCategory,
    bool clearSelectedCategory = false,
    bool? featuredOnly,
  }) {
    return MenuState(
      status: status ?? this.status,
      categories: categories ?? this.categories,
      errorMessage: errorMessage,
      selectedCategory: clearSelectedCategory ? null : (selectedCategory ?? this.selectedCategory),
      featuredOnly: featuredOnly ?? this.featuredOnly,
    );
  }

  @override
  List<Object?> get props => [status, categories, errorMessage, selectedCategory, featuredOnly];
}
