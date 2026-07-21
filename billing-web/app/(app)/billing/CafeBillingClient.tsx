"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getCafeMenu } from '@/lib/actions/products';
import { findCustomerByPhone } from '@/lib/actions/customers';
import { useToast } from '@/components/ui/Toast';
import {
  ShoppingCart, Trash2, Plus, Minus, X, User, CreditCard, Landmark, Smartphone,
  PauseCircle, PlayCircle, UtensilsCrossed, ShoppingBag, Bike
} from 'lucide-react';
import CafeItemModal from './CafeItemModal';

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash', icon: CreditCard },
  { value: 'CARD', label: 'Card', icon: Landmark },
  { value: 'UPI', label: 'UPI', icon: Smartphone },
];

const ORDER_TYPES = [
  { value: 'DINE_IN', label: 'Dine In', icon: UtensilsCrossed },
  { value: 'TAKE_AWAY', label: 'Take Away', icon: ShoppingBag },
  { value: 'DELIVERY', label: 'Delivery', icon: Bike },
];

interface CartLine {
  cartId: string;
  productId: string;
  name: string;
  variantId: string | null;
  variantName: string | null;
  selectedAddOns: { id: string; name: string; price: number }[];
  unitPrice: number;
  quantity: number;
  productType: string;
  // GST lives on the Product, not the variant/add-on — a coffee's GST% is the same across sizes.
  gstRate: number | null;
  gstInclusive: boolean;
}

export default function CafeBillingClient() {
  const router = useRouter();
  const { addToast } = useToast();

  const [menu, setMenu] = useState<any[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [modalProduct, setModalProduct] = useState<any | null>(null);

  const [cart, setCart] = useState<CartLine[]>([]);
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKE_AWAY' | 'DELIVERY'>('DINE_IN');
  const [tableNumber, setTableNumber] = useState('');

  const [customerPhone, setCustomerPhone] = useState('');
  const [customer, setCustomer] = useState<any | null>(null);
  const [customerLookupLoading, setCustomerLookupLoading] = useState(false);

  const [discount, setDiscount] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [amountReceived, setAmountReceived] = useState('');

  const [showCart, setShowCart] = useState(false); // mobile toggle
  const [showHeld, setShowHeld] = useState(false);
  const [heldBills, setHeldBills] = useState<any[]>([]);
  const [resumingBillId, setResumingBillId] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getCafeMenu().then((data) => { setMenu(data); setLoadingMenu(false); }).catch(() => setLoadingMenu(false));
  }, []);

  const refreshHeldBills = () => {
    fetch('/api/transactions/held').then(r => r.json()).then(d => setHeldBills(d.transactions || d.heldBills || [])).catch(() => {});
  };
  useEffect(() => { refreshHeldBills(); }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    menu.forEach(p => { if (p.category) set.add(p.category); });
    return ['All', ...Array.from(set).sort()];
  }, [menu]);

  const visibleProducts = useMemo(() => {
    if (activeCategory === 'All') return menu;
    return menu.filter(p => p.category === activeCategory);
  }, [menu, activeCategory]);

  const handleProductTap = (product: any) => {
    if (resumingBillId) return; // cart locked while resuming a held bill
    const hasChoices = (product.variants && product.variants.length > 0) || (product.addOns && product.addOns.length > 0);
    if (hasChoices) {
      setModalProduct(product);
    } else {
      addToCart(product, { variantId: null, variantName: null, unitPrice: product.salePrice, selectedAddOns: [], quantity: 1 });
    }
  };

  const addToCart = (product: any, selection: { variantId: string | null; variantName: string | null; unitPrice: number; selectedAddOns: { id: string; name: string; price: number }[]; quantity: number }) => {
    setCart(prev => {
      const addOnKey = selection.selectedAddOns.map(a => a.id).sort().join(',');
      const existingIdx = prev.findIndex(l =>
        l.productId === product.id &&
        l.variantId === selection.variantId &&
        l.selectedAddOns.map(a => a.id).sort().join(',') === addOnKey
      );
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = { ...next[existingIdx], quantity: next[existingIdx].quantity + selection.quantity };
        return next;
      }
      return [...prev, {
        cartId: Math.random().toString(36).slice(2),
        productId: product.id,
        name: product.name,
        variantId: selection.variantId,
        variantName: selection.variantName,
        selectedAddOns: selection.selectedAddOns,
        unitPrice: selection.unitPrice,
        quantity: selection.quantity,
        productType: product.productType,
        gstRate: product.gstRate ?? null,
        gstInclusive: product.gstInclusive === true,
      }];
    });
    setModalProduct(null);
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setCart(prev => prev.flatMap(l => {
      if (l.cartId !== cartId) return [l];
      const nextQty = l.quantity + delta;
      if (nextQty <= 0) return [];
      return [{ ...l, quantity: nextQty }];
    }));
  };

  const removeLine = (cartId: string) => setCart(prev => prev.filter(l => l.cartId !== cartId));

  const subtotal = cart.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const discountValue = parseFloat(discount) || 0;
  const discountAmount = (subtotal * discountValue) / 100;
  // GST-inclusive items already have tax baked into unitPrice (no separate add-on to the total —
  // it's shown as an "Incl. GST" note instead); only exclusive-rate items add tax on top.
  const exclusiveTaxAmount = cart.reduce((sum, l) => {
    if (!l.gstRate || l.gstInclusive) return sum;
    return sum + (l.unitPrice * l.quantity * l.gstRate) / 100;
  }, 0);
  const inclusiveTaxAmount = cart.reduce((sum, l) => {
    if (!l.gstRate || !l.gstInclusive) return sum;
    const lineTotal = l.unitPrice * l.quantity;
    return sum + (lineTotal - lineTotal / (1 + l.gstRate / 100));
  }, 0);
  const netAmount = Math.max(0, subtotal - discountAmount) + exclusiveTaxAmount;
  const changeAmount = Math.max(0, (parseFloat(amountReceived) || 0) - netAmount);

  const handleLookupCustomer = async () => {
    if (!customerPhone.trim()) { setCustomer(null); return; }
    setCustomerLookupLoading(true);
    try {
      const found = await findCustomerByPhone(customerPhone.trim());
      setCustomer(found);
      if (!found) addToast('error', 'No customer found with that phone number');
    } catch {
      addToast('error', 'Failed to look up customer');
    } finally {
      setCustomerLookupLoading(false);
    }
  };

  const buildItemsPayload = () => cart.map(l => ({
    productId: l.productId,
    quantity: l.quantity,
    salePrice: l.unitPrice,
    variantId: l.variantId,
    productType: l.productType,
    titleOverride: l.variantName ? `${l.name} (${l.variantName})` : l.name,
    selectedAddOns: l.selectedAddOns,
  }));

  const resetOrder = () => {
    setCart([]);
    setCustomer(null);
    setCustomerPhone('');
    setDiscount('0');
    setAmountReceived('');
    setTableNumber('');
    setResumingBillId(null);
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    if (orderType === 'DINE_IN' && !tableNumber.trim()) {
      addToast('error', 'Enter a table number for Dine In orders');
      return;
    }
    setSubmitting(true);
    try {
      const endpoint = resumingBillId ? `/api/transactions/${resumingBillId}/resume` : '/api/transactions';
      const body: any = resumingBillId
        ? { paymentMethod, amountReceived: parseFloat(amountReceived) || netAmount, changeAmount }
        : {
            items: buildItemsPayload(),
            discount: discountValue,
            taxAmount: exclusiveTaxAmount,
            customerId: customer?.id,
            customerName: customer?.name,
            customerPhone: customerPhone || undefined,
            paymentMethod,
            amountReceived: parseFloat(amountReceived) || netAmount,
            changeAmount,
            tableNumber: orderType === 'DINE_IN' ? tableNumber : undefined,
            orderType,
          };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to place order');

      addToast('success', 'Order placed!');
      resetOrder();
      refreshHeldBills();
      router.push(`/billing/${data.transaction.id}`);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleHoldOrder = async () => {
    if (cart.length === 0) return;
    if (orderType === 'DINE_IN' && !tableNumber.trim()) {
      addToast('error', 'Enter a table number for Dine In orders');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/transactions/hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: buildItemsPayload(),
          discount: discountValue,
          taxAmount: exclusiveTaxAmount,
          customerId: customer?.id,
          customerName: customer?.name,
          customerPhone: customerPhone || undefined,
          tableNumber: orderType === 'DINE_IN' ? tableNumber : undefined,
          orderType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to hold order');
      addToast('success', 'Order sent to kitchen / held');
      resetOrder();
      refreshHeldBills();
    } catch (err: any) {
      addToast('error', err.message || 'Failed to hold order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResumeHeldBill = (bill: any) => {
    setCart(bill.items.map((item: any) => ({
      cartId: Math.random().toString(36).slice(2),
      productId: item.productId,
      name: item.name,
      variantId: item.variantId,
      variantName: null,
      selectedAddOns: Array.isArray(item.selectedAddOns) ? item.selectedAddOns : [],
      unitPrice: item.salePrice,
      quantity: item.quantity,
      productType: item.productType,
      // Resuming re-sends only payment details, not items/tax (the server re-derives everything
      // from the original held Transaction's own taxAmount) — these are display-only here.
      gstRate: null,
      gstInclusive: false,
    })));
    setDiscount(String(bill.discount || 0));
    setTableNumber(bill.tableNumber || '');
    setOrderType(bill.orderType || 'DINE_IN');
    if (bill.customerName) setCustomer({ id: bill.customerId, name: bill.customerName, phone: bill.customerPhone });
    setResumingBillId(bill.id);
    setShowHeld(false);
    setShowCart(true);
  };

  const handleDeleteHeldBill = async (billId: string) => {
    try {
      await fetch(`/api/transactions/${billId}`, { method: 'DELETE' });
      refreshHeldBills();
      if (resumingBillId === billId) resetOrder();
    } catch {
      addToast('error', 'Failed to remove held order');
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] -mx-4 sm:-mx-6 -my-4 sm:-my-6 flex flex-col bg-gray-50">
      {/* Top bar: order type + table + held orders */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5 bg-gray-100 rounded-xl p-1">
          {ORDER_TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => setOrderType(t.value as any)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                orderType === t.value ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>

        {orderType === 'DINE_IN' && (
          <input
            type="text"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            placeholder="Table #"
            className="w-28 px-3 py-2 rounded-lg border border-gray-300 text-sm font-semibold"
          />
        )}

        <button
          onClick={() => setShowHeld(true)}
          className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100"
        >
          <PauseCircle className="w-4 h-4" /> Held Orders {heldBills.length > 0 && `(${heldBills.length})`}
        </button>

        <button
          onClick={() => setShowCart(true)}
          className="lg:hidden relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white bg-indigo-600"
        >
          <ShoppingCart className="w-4 h-4" /> {cart.length}
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Menu grid */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex gap-2 px-4 py-3 overflow-x-auto bg-white border-b border-gray-100">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                  activeCategory === cat ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {loadingMenu ? (
              <p className="text-center text-gray-400 py-16">Loading menu…</p>
            ) : visibleProducts.length === 0 ? (
              <p className="text-center text-gray-400 py-16">No items in this category yet.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {visibleProducts.map(product => (
                  <button
                    key={product.id}
                    onClick={() => handleProductTap(product)}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all text-left overflow-hidden active:scale-[0.97]"
                  >
                    <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <UtensilsCrossed className="w-8 h-8 text-gray-300" />
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-bold text-gray-900 truncate">{product.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {product.productType === 'VARIANT' && product.variants.length > 0
                          ? `From ₹${Math.min(...product.variants.map((v: any) => v.salePrice)).toFixed(0)}`
                          : `₹${product.salePrice.toFixed(2)}`}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile cart drawer backdrop: only mounted while open, and never rendered at lg+ widths */}
        {showCart && (
          <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setShowCart(false)} />
        )}

        {/* Cart + checkout panel: static in-flow on desktop (cafe-cart-panel CSS rule forces this;
            Tailwind's lg:static utility isn't being generated by this project's build for reasons
            unrelated to this component, so the override lives in globals.css instead); slide-in
            fixed drawer on mobile when open. */}
        <div className={`
          cafe-cart-panel
          ${showCart ? 'fixed inset-y-0 right-0 z-40 flex' : 'hidden'}
          lg:z-0 lg:flex
          w-full max-w-sm lg:w-96 bg-white border-l border-gray-200 flex-col h-full
        `}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{resumingBillId ? 'Resuming Order' : 'Current Order'}</h2>
              <button onClick={() => setShowCart(false)} className="lg:hidden p-1 text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Single scrollable region for items + checkout controls together, so the checkout
                footer (customer/payment/totals) never squeezes the item list to near-zero height
                on shorter viewports — both scroll as one unit instead of competing for fixed space. */}
            <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="p-5 space-y-3">
              {cart.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-10">No items yet. Tap a menu item to add it.</p>
              ) : (
                cart.map(line => (
                  <div key={line.cartId} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{line.name}{line.variantName ? ` (${line.variantName})` : ''}</p>
                        {line.selectedAddOns.length > 0 && (
                          <p className="text-xs text-gray-500 mt-0.5">+ {line.selectedAddOns.map(a => a.name).join(', ')}</p>
                        )}
                      </div>
                      {!resumingBillId && (
                        <button onClick={() => removeLine(line.cartId)} className="text-gray-400 hover:text-rose-500 flex-shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <button disabled={!!resumingBillId} onClick={() => updateQuantity(line.cartId, -1)} className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 disabled:opacity-40">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-bold w-5 text-center">{line.quantity}</span>
                        <button disabled={!!resumingBillId} onClick={() => updateQuantity(line.cartId, 1)} className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 disabled:opacity-40">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-sm font-black text-gray-900">₹{(line.unitPrice * line.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-gray-100 p-5 space-y-4"
>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  onBlur={handleLookupCustomer}
                  placeholder="Customer phone (optional)"
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300"
                />
                {customer && <span className="text-xs font-bold text-emerald-600 self-center flex items-center gap-1"><User className="w-3.5 h-3.5" /> {customer.name}</span>}
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-semibold text-gray-900">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <label className="text-sm text-gray-500">Discount %</label>
                <input type="number" min="0" max="100" value={discount} onChange={(e) => setDiscount(e.target.value)} className="w-20 px-2 py-1.5 text-sm text-right rounded-lg border border-gray-300" />
              </div>
              {exclusiveTaxAmount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">GST</span>
                  <span className="font-semibold text-gray-900">₹{exclusiveTaxAmount.toFixed(2)}</span>
                </div>
              )}
              {inclusiveTaxAmount > 0 && (
                <p className="text-[11px] text-gray-400 text-right -mt-1">Incl. GST ₹{inclusiveTaxAmount.toFixed(2)}</p>
              )}
              <div className="flex items-center justify-between text-base font-black text-gray-900 pt-2 border-t border-gray-100">
                <span>Total</span>
                <span>₹{netAmount.toFixed(2)}</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_METHODS.map(m => (
                  <button
                    key={m.value}
                    onClick={() => setPaymentMethod(m.value)}
                    className={`flex flex-col items-center gap-1 py-2 rounded-xl border-2 text-xs font-bold transition-colors ${
                      paymentMethod === m.value ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500'
                    }`}
                  >
                    <m.icon className="w-4 h-4" /> {m.label}
                  </button>
                ))}
              </div>

              <input
                type="number"
                min="0"
                step="0.01"
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                placeholder={`Amount received (₹${netAmount.toFixed(2)})`}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300"
              />

              <div className="flex gap-2">
                {!resumingBillId && (
                  <button
                    onClick={handleHoldOrder}
                    disabled={submitting || cart.length === 0}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl border border-gray-300 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <PauseCircle className="w-4 h-4" /> Hold
                  </button>
                )}
                <button
                  onClick={handlePlaceOrder}
                  disabled={submitting || cart.length === 0}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? 'Placing…' : resumingBillId ? 'Complete Order' : 'Place Order'}
                </button>
              </div>
              {resumingBillId && (
                <button onClick={resetOrder} className="w-full text-xs text-gray-400 hover:text-gray-600 text-center">
                  Cancel resume
                </button>
              )}
            </div>
            </div>
          </div>
      </div>

      {modalProduct && (
        <CafeItemModal
          product={modalProduct}
          onClose={() => setModalProduct(null)}
          onConfirm={(selection) => addToCart(modalProduct, selection)}
        />
      )}

      {showHeld && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowHeld(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Held Orders</h2>
              <button onClick={() => setShowHeld(false)} className="p-1 text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-2">
              {heldBills.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-8">No held orders.</p>
              ) : (
                heldBills.map(bill => (
                  <div key={bill.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-indigo-200">
                    <button onClick={() => handleResumeHeldBill(bill)} className="flex-1 text-left flex items-center gap-3">
                      <PlayCircle className="w-5 h-5 text-indigo-600" />
                      <span>
                        <span className="block text-sm font-bold text-gray-900">
                          {bill.tableNumber ? `Table ${bill.tableNumber}` : (bill.orderType || 'Order')}
                        </span>
                        <span className="block text-xs text-gray-500">{bill.items?.length || 0} items · ₹{bill.netAmount?.toFixed(2)}</span>
                      </span>
                    </button>
                    <button onClick={() => handleDeleteHeldBill(bill.id)} className="p-2 text-gray-400 hover:text-rose-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
