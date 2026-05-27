class AppValidators {
  static String? Function(String?) required(String message) {
    return (String? value) {
      if (value == null || value.trim().isEmpty) {
        return message;
      }
      return null;
    };
  }

  static String? price(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Please enter a price';
    }
    if (double.tryParse(value) == null) {
      return 'Please enter a valid number';
    }
    if (double.parse(value) < 0) {
      return 'Price cannot be negative';
    }
    return null;
  }

  static String? productName(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Product name is required';
    }
    if (value.trim().length < 2) {
      return 'Product name must be at least 2 characters';
    }
    if (value.trim().length > 100) {
      return 'Product name cannot exceed 100 characters';
    }
    return null;
  }

  static String? barcode(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Barcode is required';
    }
    if (value.trim().length < 4) {
      return 'Barcode must be at least 4 characters';
    }
    if (value.trim().length > 50) {
      return 'Barcode cannot exceed 50 characters';
    }
    return null;
  }

  static String? stock(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Stock is required';
    }
    if (int.tryParse(value) == null) {
      return 'Please enter a valid number';
    }
    if (int.parse(value) < 0) {
      return 'Stock cannot be negative';
    }
    return null;
  }

  static String? quantity(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Quantity is required';
    }
    if (int.tryParse(value) == null) {
      return 'Please enter a valid number';
    }
    if (int.parse(value) <= 0) {
      return 'Quantity must be greater than 0';
    }
    return null;
  }

  static String? shopName(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Shop name is required';
    }
    if (value.trim().length < 2) {
      return 'Shop name must be at least 2 characters';
    }
    if (value.trim().length > 100) {
      return 'Shop name cannot exceed 100 characters';
    }
    return null;
  }

  static String? phoneNumber(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Phone number is required';
    }
    if (!RegExp(r'^[0-9]{10,}$').hasMatch(value.replaceAll(RegExp(r'\D'), ''))) {
      return 'Please enter a valid phone number';
    }
    return null;
  }

  static String? upiId(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'UPI ID cannot be empty';
    }
    if (!RegExp(r'^[a-zA-Z0-9._]+@[a-zA-Z]+$').hasMatch(value)) {
      return 'Please enter a valid UPI ID';
    }
    return null;
  }

  static String? taxRate(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Tax rate is required';
    }
    if (double.tryParse(value) == null) {
      return 'Please enter a valid number';
    }
    final rate = double.parse(value);
    if (rate < 0 || rate > 100) {
      return 'Tax rate must be between 0 and 100';
    }
    return null;
  }

  static String? discountPercentage(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Discount percentage is required';
    }
    if (double.tryParse(value) == null) {
      return 'Please enter a valid number';
    }
    final discount = double.parse(value);
    if (discount < 0 || discount > 100) {
      return 'Discount must be between 0 and 100%';
    }
    return null;
  }
}
