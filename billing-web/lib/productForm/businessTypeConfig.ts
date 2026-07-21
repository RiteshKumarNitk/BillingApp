// Single source of truth for how the Add/Edit Product forms adapt to a tenant's businessType.
// Shared by AddProductClient.tsx and EditProductClient.tsx so the two forms can't drift out of
// sync on what counts as "relevant" per business type. businessType is null for grandfathered
// (general/medical-store-style) tenants, which must see the exact original field set.

export type BusinessType = 'CAFE' | 'LAUNDRY' | 'SALON';

const DEFAULT_PRESET_CATEGORIES = [
  'Vegetables', 'Fruits', 'Grocery', 'FMCG', 'Medical',
  'Dairy', 'Hardware', 'Clothing', 'Electronics', 'Restaurant'
];

const PRESET_CATEGORIES_BY_TYPE: Record<BusinessType, string[]> = {
  CAFE: ['Starters', 'Main Course', 'Beverages', 'Desserts', 'Combos', 'Sides'],
  LAUNDRY: ['Wash & Fold', 'Dry Cleaning', 'Ironing', 'Stain Removal', 'Shoe Cleaning', 'Curtains & Linen'],
  SALON: ['Hair', 'Skin Care', 'Nail Care', 'Spa & Massage', 'Makeup', 'Bridal Packages'],
};

const CATEGORY_LABEL_BY_TYPE: Record<BusinessType, string> = {
  CAFE: 'Menu Category',
  LAUNDRY: 'Service Category',
  SALON: 'Service Category',
};

const DEFAULT_PRODUCT_TYPE_OPTIONS = [
  { value: 'SIMPLE', label: 'Simple Product (Generic item)' },
  { value: 'WEIGHT', label: 'Weight Based (Loose items, Vegetables)' },
  { value: 'VARIANT', label: 'Variant Based (Sizes, Packaging)' },
  { value: 'BATCH', label: 'Batch Managed (Medicines, FMCG)' },
  { value: 'SERIAL', label: 'Serial Managed (Electronics, IMEI)' },
  { value: 'SERVICE', label: 'Service (No inventory)' },
];

// Cafe/Laundry/Salon deliberately exclude WEIGHT/BATCH/SERIAL — those are the retail/medical
// inventory-complexity features this pivot explicitly defers to a later phase.
const PRODUCT_TYPE_OPTIONS_BY_TYPE: Record<BusinessType, { value: string; label: string }[]> = {
  CAFE: [
    { value: 'SIMPLE', label: 'Simple Item (fixed price)' },
    { value: 'VARIANT', label: 'Sized (Small / Medium / Large)' },
    { value: 'SERVICE', label: 'Made to Order (no stock tracking)' },
    { value: 'COMBO', label: 'Combo Meal (bundle of other items)' },
  ],
  LAUNDRY: [
    { value: 'SIMPLE', label: 'Simple Service (fixed price)' },
    { value: 'VARIANT', label: 'Tiered (e.g. Standard / Urgent)' },
    { value: 'SERVICE', label: 'Service (no stock tracking)' },
  ],
  SALON: [
    { value: 'SIMPLE', label: 'Simple Service (fixed price)' },
    { value: 'VARIANT', label: 'Tiered pricing' },
    { value: 'SERVICE', label: 'Service (no stock tracking)' },
  ],
};

function normalize(businessType: string | null | undefined): BusinessType | null {
  return businessType === 'CAFE' || businessType === 'LAUNDRY' || businessType === 'SALON' ? businessType : null;
}

export function getProductTypeOptions(businessType: string | null | undefined) {
  const bt = normalize(businessType);
  return bt ? PRODUCT_TYPE_OPTIONS_BY_TYPE[bt] : DEFAULT_PRODUCT_TYPE_OPTIONS;
}

export function getPresetCategories(businessType: string | null | undefined) {
  const bt = normalize(businessType);
  return bt ? PRESET_CATEGORIES_BY_TYPE[bt] : DEFAULT_PRESET_CATEGORIES;
}

export function getCategoryLabel(businessType: string | null | undefined) {
  const bt = normalize(businessType);
  return bt ? CATEGORY_LABEL_BY_TYPE[bt] : 'Category';
}

// Laundry/Salon services have no retail stock concept at all, regardless of productType.
// Cafe keeps the existing productType-driven rule (a cafe may genuinely track baked-goods stock).
export function hideStockFields(businessType: string | null | undefined) {
  const bt = normalize(businessType);
  return bt === 'LAUNDRY' || bt === 'SALON';
}

export function showGarmentType(businessType: string | null | undefined) {
  return normalize(businessType) === 'LAUNDRY';
}

export function showDuration(businessType: string | null | undefined) {
  return normalize(businessType) === 'SALON';
}

export function showAddOns(businessType: string | null | undefined, productType: string) {
  return normalize(businessType) === 'CAFE' && productType !== 'COMBO';
}

export function showComboComponents(businessType: string | null | undefined, productType: string) {
  return normalize(businessType) === 'CAFE' && productType === 'COMBO';
}

// CafeOS Phase 2 additions. Gating helpers only — the Menu Management form (Phase 3) wires these
// into actual fields; kept here so the gating logic has one home, matching every helper above.
export const FOOD_TYPE_OPTIONS = [
  { value: 'VEG', label: 'Veg' },
  { value: 'NON_VEG', label: 'Non-Veg' },
  { value: 'VEGAN', label: 'Vegan' },
  { value: 'JAIN', label: 'Jain' },
];

export function showFoodType(businessType: string | null | undefined) {
  return normalize(businessType) === 'CAFE';
}

export function showGstFields(businessType: string | null | undefined) {
  return normalize(businessType) === 'CAFE';
}

export function showAvailabilityToggle(businessType: string | null | undefined) {
  return normalize(businessType) === 'CAFE';
}

export function showFeaturedToggle(businessType: string | null | undefined) {
  return normalize(businessType) === 'CAFE';
}

// Cafe's Menu Management form labels the shared `durationMinutes` column "Prep Time" instead of
// Salon's "Duration" (showDuration, above) — same column, different business-facing meaning.
export function showPrepTime(businessType: string | null | undefined) {
  return normalize(businessType) === 'CAFE';
}

// CafeOS terminology pass (Phase 3): Cafe tenants see "Menu Management"/"Menu Item" instead of
// "Products"/"Product" throughout the app; every other business type (including null/legacy
// tenants) keeps the original wording unchanged.
export function getProductNoun(businessType: string | null | undefined) {
  return normalize(businessType) === 'CAFE' ? 'Menu Item' : 'Product';
}

export function getProductsAreaLabel(businessType: string | null | undefined) {
  return normalize(businessType) === 'CAFE' ? 'Menu Management' : 'Products';
}
