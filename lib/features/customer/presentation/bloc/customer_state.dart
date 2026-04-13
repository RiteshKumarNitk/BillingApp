part of 'customer_bloc.dart';

enum CustomerStatus { initial, loading, success, error, saving }

class CustomerState extends Equatable {
  final CustomerStatus status;
  final List<Customer> customers;
  final String errorMessage;
  final String successMessage;
  final String searchQuery;

  const CustomerState({
    this.status = CustomerStatus.initial,
    this.customers = const [],
    this.errorMessage = '',
    this.successMessage = '',
    this.searchQuery = '',
  });

  CustomerState copyWith({
    CustomerStatus? status,
    List<Customer>? customers,
    String? errorMessage,
    String? successMessage,
    String? searchQuery,
  }) {
    return CustomerState(
      status: status ?? this.status,
      customers: customers ?? this.customers,
      errorMessage: errorMessage ?? this.errorMessage,
      successMessage: successMessage ?? this.successMessage,
      searchQuery: searchQuery ?? this.searchQuery,
    );
  }

  @override
  List<Object?> get props => [
    status,
    customers,
    errorMessage,
    successMessage,
    searchQuery,
  ];
}
