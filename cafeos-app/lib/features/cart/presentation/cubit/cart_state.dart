import 'package:equatable/equatable.dart';
import '../../domain/entities/cart_item.dart';

class CartState extends Equatable {
  final String? tenantId;
  final String? tenantName;
  final String? tenantLogoUrl;
  // Set when the cart originated from a scanned table QR — threaded through to checkout as
  // DINE_IN ordering, matching the website's CartContext.tableToken.
  final String? tableToken;
  final String? tableLabel;
  final List<CartItem> items;

  const CartState({
    this.tenantId,
    this.tenantName,
    this.tenantLogoUrl,
    this.tableToken,
    this.tableLabel,
    this.items = const [],
  });

  bool get isEmpty => items.isEmpty;
  int get itemCount => items.fold(0, (sum, i) => sum + i.quantity);
  double get subtotal => items.fold(0.0, (sum, i) => sum + i.lineTotal);

  CartState copyWith({
    String? tenantId,
    String? tenantName,
    String? tenantLogoUrl,
    String? tableToken,
    String? tableLabel,
    List<CartItem>? items,
    bool clearTable = false,
  }) {
    return CartState(
      tenantId: tenantId ?? this.tenantId,
      tenantName: tenantName ?? this.tenantName,
      tenantLogoUrl: tenantLogoUrl ?? this.tenantLogoUrl,
      tableToken: clearTable ? null : (tableToken ?? this.tableToken),
      tableLabel: clearTable ? null : (tableLabel ?? this.tableLabel),
      items: items ?? this.items,
    );
  }

  @override
  List<Object?> get props => [tenantId, tenantName, tenantLogoUrl, tableToken, tableLabel, items];
}
