import 'package:hive/hive.dart';
import '../../domain/entities/discount.dart';

part 'discount_model.g.dart';

@HiveType(typeId: 8)
class DiscountModel extends Discount {
  @override
  @HiveField(0)
  final String id;

  @override
  @HiveField(1)
  final String name;

  @override
  @HiveField(2)
  final String description;

  @override
  @HiveField(3)
  final double discountPercentage;

  @override
  @HiveField(4)
  final String? applicableCategory;

  @override
  @HiveField(5)
  final int? minimumQuantity;

  @override
  @HiveField(6)
  final DateTime startDate;

  @override
  @HiveField(7)
  final DateTime endDate;

  @override
  @HiveField(8)
  final bool isActive;

  const DiscountModel({
    required this.id,
    required this.name,
    required this.description,
    required this.discountPercentage,
    this.applicableCategory,
    this.minimumQuantity,
    required this.startDate,
    required this.endDate,
    this.isActive = true,
  }) : super(
    id: id,
    name: name,
    description: description,
    discountPercentage: discountPercentage,
    applicableCategory: applicableCategory,
    minimumQuantity: minimumQuantity,
    startDate: startDate,
    endDate: endDate,
    isActive: isActive,
  );

  factory DiscountModel.fromEntity(Discount discount) {
    return DiscountModel(
      id: discount.id,
      name: discount.name,
      description: discount.description,
      discountPercentage: discount.discountPercentage,
      applicableCategory: discount.applicableCategory,
      minimumQuantity: discount.minimumQuantity,
      startDate: discount.startDate,
      endDate: discount.endDate,
      isActive: discount.isActive,
    );
  }

  Discount toEntity() {
    return Discount(
      id: id,
      name: name,
      description: description,
      discountPercentage: discountPercentage,
      applicableCategory: applicableCategory,
      minimumQuantity: minimumQuantity,
      startDate: startDate,
      endDate: endDate,
      isActive: isActive,
    );
  }

  factory DiscountModel.fromJson(Map<String, dynamic> json) {
    return DiscountModel(
      id: json['id'],
      name: json['name'],
      description: json['description'] ?? '',
      discountPercentage: (json['discountPercentage'] ?? 0).toDouble(),
      applicableCategory: json['applicableCategory'],
      minimumQuantity: json['minimumQuantity'],
      startDate: json['startDate'] != null ? DateTime.parse(json['startDate']) : DateTime.now(),
      endDate: json['endDate'] != null ? DateTime.parse(json['endDate']) : DateTime.now(),
      isActive: json['isActive'] ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'description': description,
      'discountPercentage': discountPercentage,
      'applicableCategory': applicableCategory,
      'minimumQuantity': minimumQuantity,
      'startDate': startDate.toIso8601String(),
      'endDate': endDate.toIso8601String(),
      'isActive': isActive,
    };
  }
}
