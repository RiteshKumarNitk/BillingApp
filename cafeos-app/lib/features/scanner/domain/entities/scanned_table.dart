import 'package:equatable/equatable.dart';

class ScannedTable extends Equatable {
  final String tenantId;
  final String token;
  final String label;

  const ScannedTable({required this.tenantId, required this.token, required this.label});

  @override
  List<Object?> get props => [tenantId, token, label];
}
