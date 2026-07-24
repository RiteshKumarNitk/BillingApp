import 'package:equatable/equatable.dart';
import '../../domain/entities/customer_address.dart';

enum AddressesStatus { initial, loading, loaded, error }

class AddressesState extends Equatable {
  final AddressesStatus status;
  final List<CustomerAddress> addresses;
  final String? errorMessage;
  // Set only while a create/update/delete mutation is in flight, keyed by nothing in particular —
  // just enough to disable buttons and show a spinner without a full-list reload flicker.
  final bool isMutating;

  const AddressesState({
    this.status = AddressesStatus.initial,
    this.addresses = const [],
    this.errorMessage,
    this.isMutating = false,
  });

  AddressesState copyWith({
    AddressesStatus? status,
    List<CustomerAddress>? addresses,
    String? errorMessage,
    bool? isMutating,
  }) {
    return AddressesState(
      status: status ?? this.status,
      addresses: addresses ?? this.addresses,
      errorMessage: errorMessage,
      isMutating: isMutating ?? this.isMutating,
    );
  }

  @override
  List<Object?> get props => [status, addresses, errorMessage, isMutating];
}
