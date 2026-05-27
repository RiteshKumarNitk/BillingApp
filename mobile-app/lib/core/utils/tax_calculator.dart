class TaxCalculator {
  static const double DEFAULT_TAX_RATE = 18.0; // 18% by default

  /// Calculate tax amount for a given subtotal
  static double calculateTax(double subtotal, {double? taxRate}) {
    final rate = (taxRate ?? DEFAULT_TAX_RATE) / 100;
    return subtotal * rate;
  }

  /// Calculate total including tax
  static double calculateTotal(double subtotal, {double? taxRate}) {
    final tax = calculateTax(subtotal, taxRate: taxRate);
    return subtotal + tax;
  }

  /// Get formatted tax display
  static String formatTaxDisplay(double amount) {
    return amount.toStringAsFixed(2);
  }

  /// Validate tax rate (should be between 0-100)
  static bool isValidTaxRate(double rate) {
    return rate >= 0 && rate <= 100;
  }
}
