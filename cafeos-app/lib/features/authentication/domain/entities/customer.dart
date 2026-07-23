import 'package:equatable/equatable.dart';

class Customer extends Equatable {
  final String id;
  final String name;
  final String email;
  final String? phone;

  const Customer({required this.id, required this.name, required this.email, this.phone});

  @override
  List<Object?> get props => [id, name, email, phone];
}
