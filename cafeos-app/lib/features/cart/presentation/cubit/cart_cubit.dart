import 'dart:convert';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/storage/local_storage_service.dart';
import '../../domain/entities/cart_item.dart';
import 'cart_state.dart';

/// A CafeOS cart holds items from exactly one cafe at a time (mirrors billing-web's
/// CartContext.tsx) — adding an item from a different cafe than what's already in the cart
/// requires an explicit clear first (see [belongsToOtherTenant]), never a silent merge. Persisted
/// to shared_preferences as JSON so it survives an app restart; there's deliberately no
/// domain/data split here (unlike every networked feature) since a local-only cubit has no
/// `Either<Failure, T>` semantics to model.
class CartCubit extends Cubit<CartState> {
  final LocalStorageService _localStorage;

  CartCubit({required LocalStorageService localStorage})
      : _localStorage = localStorage,
        super(const CartState()) {
    _restore();
  }

  void _restore() {
    final raw = _localStorage.cartJson;
    if (raw == null) return;
    try {
      final json = jsonDecode(raw) as Map<String, dynamic>;
      emit(CartState(
        tenantId: json['tenantId'] as String?,
        tenantName: json['tenantName'] as String?,
        tenantLogoUrl: json['tenantLogoUrl'] as String?,
        tableToken: json['tableToken'] as String?,
        tableLabel: json['tableLabel'] as String?,
        items: ((json['items'] as List<dynamic>?) ?? []).map((i) => CartItem.fromJson(i as Map<String, dynamic>)).toList(),
      ));
    } catch (_) {
      // Corrupt/old-shape local cart — start fresh rather than crash.
      _localStorage.setCartJson(null);
    }
  }

  void _persist() {
    if (state.isEmpty) {
      _localStorage.setCartJson(null);
      return;
    }
    _localStorage.setCartJson(jsonEncode({
      'tenantId': state.tenantId,
      'tenantName': state.tenantName,
      'tenantLogoUrl': state.tenantLogoUrl,
      'tableToken': state.tableToken,
      'tableLabel': state.tableLabel,
      'items': state.items.map((i) => i.toJson()).toList(),
    }));
  }

  bool belongsToOtherTenant(String tenantId) => state.tenantId != null && state.tenantId != tenantId && !state.isEmpty;

  /// Call only after confirming with the user when [belongsToOtherTenant] is true.
  void addItem({
    required String tenantId,
    required String tenantName,
    String? tenantLogoUrl,
    required CartItem item,
    String? tableToken,
    String? tableLabel,
  }) {
    final startingFresh = state.tenantId != tenantId;
    final items = startingFresh ? <CartItem>[] : List<CartItem>.from(state.items);

    final existingIndex = items.indexWhere((i) => i.key == item.key);
    if (existingIndex >= 0) {
      items[existingIndex] = items[existingIndex].copyWith(quantity: items[existingIndex].quantity + item.quantity);
    } else {
      items.add(item);
    }

    emit(state.copyWith(
      tenantId: tenantId,
      tenantName: tenantName,
      tenantLogoUrl: tenantLogoUrl,
      items: items,
      tableToken: tableToken ?? (startingFresh ? null : state.tableToken),
      tableLabel: tableLabel ?? (startingFresh ? null : state.tableLabel),
      clearTable: startingFresh && tableToken == null,
    ));
    _persist();
  }

  void updateQuantity(String key, int quantity) {
    final items = List<CartItem>.from(state.items);
    final index = items.indexWhere((i) => i.key == key);
    if (index < 0) return;
    if (quantity <= 0) {
      items.removeAt(index);
    } else {
      items[index] = items[index].copyWith(quantity: quantity);
    }
    emit(state.copyWith(items: items));
    _persist();
  }

  void removeItem(String key) => updateQuantity(key, 0);

  void setTable({required String token, required String label}) {
    emit(state.copyWith(tableToken: token, tableLabel: label));
    _persist();
  }

  void clear() {
    emit(const CartState());
    _localStorage.setCartJson(null);
  }
}
