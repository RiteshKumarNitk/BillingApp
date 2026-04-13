part of 'customer_bloc.dart';

abstract class CustomerEvent extends Equatable {
  const CustomerEvent();

  @override
  List<Object?> get props => [];
}

class LoadAllCustomers extends CustomerEvent {
  const LoadAllCustomers();
}

class SearchCustomers extends CustomerEvent {
  final String query;

  const SearchCustomers(this.query);

  @override
  List<Object?> get props => [query];
}

class SaveCustomer extends CustomerEvent {
  final Customer customer;

  const SaveCustomer(this.customer);

  @override
  List<Object?> get props => [customer];
}

class ResetCustomerState extends CustomerEvent {
  const ResetCustomerState();
}
