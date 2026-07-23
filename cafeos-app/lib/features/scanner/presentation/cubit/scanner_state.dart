import 'package:equatable/equatable.dart';
import '../../../cafes/domain/entities/cafe.dart';
import '../../domain/entities/scanned_table.dart';

enum ScannerStatus { idle, processing, success, invalidQr, error }

class ScannerState extends Equatable {
  final ScannerStatus status;
  final Cafe? cafe;
  final ScannedTable? table;
  final String? errorMessage;

  const ScannerState({this.status = ScannerStatus.idle, this.cafe, this.table, this.errorMessage});

  ScannerState copyWith({ScannerStatus? status, Cafe? cafe, ScannedTable? table, String? errorMessage}) {
    return ScannerState(
      status: status ?? this.status,
      cafe: cafe ?? this.cafe,
      table: table ?? this.table,
      errorMessage: errorMessage,
    );
  }

  @override
  List<Object?> get props => [status, cafe, table, errorMessage];
}
