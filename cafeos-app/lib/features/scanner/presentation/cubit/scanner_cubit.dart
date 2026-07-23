import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../cafes/domain/usecases/get_cafe_by_id_usecase.dart';
import '../../domain/entities/scanned_table.dart';
import '../../domain/repositories/table_repository.dart';
import 'scanner_state.dart';

/// Orchestrates the full scan flow described in the mobile spec: validate QR -> fetch cafe info ->
/// (Menu/Cart pick up the table from here). Parsing + network calls are done once per scan and
/// gated by [status] so `MobileScanner`'s onDetect (which can fire many times per frame while the
/// code stays in view) doesn't fire duplicate requests.
class ScannerCubit extends Cubit<ScannerState> {
  final TableRepository _tableRepository;
  final GetCafeByIdUseCase _getCafeByIdUseCase;

  ScannerCubit({required TableRepository tableRepository, required GetCafeByIdUseCase getCafeByIdUseCase})
      : _tableRepository = tableRepository,
        _getCafeByIdUseCase = getCafeByIdUseCase,
        super(const ScannerState());

  Future<void> handleScan(String rawValue) async {
    if (state.status == ScannerStatus.processing) return;

    final parsed = _parse(rawValue);
    if (parsed == null) {
      emit(state.copyWith(status: ScannerStatus.invalidQr, errorMessage: "That doesn't look like a CafeOS table QR code."));
      return;
    }

    emit(state.copyWith(status: ScannerStatus.processing));

    final tableResult = await _tableRepository.validateTable(tenantId: parsed.tenantId, token: parsed.token);
    final label = tableResult.fold((failure) => null, (label) => label);
    if (label == null) {
      final message = tableResult.fold((failure) => failure.message, (_) => null);
      emit(state.copyWith(status: ScannerStatus.invalidQr, errorMessage: message ?? "That doesn't look like a valid table QR code."));
      return;
    }

    final cafeResult = await _getCafeByIdUseCase(parsed.tenantId);
    cafeResult.match(
      (failure) => emit(state.copyWith(status: ScannerStatus.error, errorMessage: failure.message)),
      (cafe) => emit(state.copyWith(
        status: ScannerStatus.success,
        cafe: cafe,
        table: ScannedTable(tenantId: parsed.tenantId, token: parsed.token, label: label),
      )),
    );
  }

  void reset() => emit(const ScannerState());

  /// Scanned value is a URL shaped like `{origin}/site/{tenantId}?t={qrToken}` — the exact pattern
  /// the Tables admin page (billing-web's TablesClient.getTableUrl) already encodes into every
  /// printed QR image.
  _ParsedQr? _parse(String rawValue) {
    final uri = Uri.tryParse(rawValue);
    if (uri == null) return null;

    final token = uri.queryParameters['t'];
    if (token == null || token.isEmpty) return null;

    final segments = uri.pathSegments;
    final siteIndex = segments.indexOf('site');
    if (siteIndex == -1 || siteIndex + 1 >= segments.length) return null;
    final tenantId = segments[siteIndex + 1];
    if (tenantId.isEmpty) return null;

    return _ParsedQr(tenantId: tenantId, token: token);
  }
}

class _ParsedQr {
  final String tenantId;
  final String token;
  const _ParsedQr({required this.tenantId, required this.token});
}
