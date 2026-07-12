"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { searchProducts } from '@/lib/actions/products';
import { findCustomerByPhone } from '@/lib/actions/customers';
import { getMyPermissions } from '@/lib/actions/users';
import { useToast } from '@/components/ui/Toast';
import { Search, Camera, Plus, Minus, Trash2, Barcode, X, ShoppingCart, AlertCircle, Printer, User, CreditCard, Landmark, Smartphone, ChevronDown, Check, Package, Tag, Star, PauseCircle, PlayCircle } from 'lucide-react';
import ProductSelectionModal from './ProductSelectionModal';

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash', icon: CreditCard },
  { value: 'CARD', label: 'Card', icon: Landmark },
  { value: 'UPI', label: 'UPI', icon: Smartphone },
  { value: 'OTHER', label: 'Other', icon: CreditCard },
];

export default function BillingPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [discount, setDiscount] = useState(0);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const barcodeRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<number | null>(null);
  const cartRef = useRef<HTMLDivElement>(null);

  const [selectedComplexProduct, setSelectedComplexProduct] = useState<any>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [amountReceived, setAmountReceived] = useState('');
  const [showPaymentDropdown, setShowPaymentDropdown] = useState(false);
  const [splitPayment, setSplitPayment] = useState(false);
  const [paymentRows, setPaymentRows] = useState<{ method: string; amount: string }[]>([
    { method: 'CASH', amount: '' },
    { method: 'UPI', amount: '' },
  ]);
  const [couponCode, setCouponCode] = useState('');
  const [matchedCustomer, setMatchedCustomer] = useState<{ id: string; name: string; phone: string | null; loyaltyPoints: number } | null>(null);
  const [redeemPoints, setRedeemPoints] = useState(0);
  const [customerLookupLoading, setCustomerLookupLoading] = useState(false);
  const [showHeldBills, setShowHeldBills] = useState(false);
  const [heldBills, setHeldBills] = useState<any[]>([]);
  const [heldBillsLoading, setHeldBillsLoading] = useState(false);
  const [holdLoading, setHoldLoading] = useState(false);
  // Set while a held bill is loaded for review before completing payment. The items shown come
  // straight from the held record and can't be edited here — resuming goes through
  // /api/transactions/[id]/resume, which only re-validates and accepts payment info, not item
  // changes, so the cart is locked to avoid showing edits that would silently be discarded.
  const [resumingBillId, setResumingBillId] = useState<string | null>(null);
  const [canOverridePrice, setCanOverridePrice] = useState(false);

  const fetchProducts = useCallback(async (term: string) => {
    setSearchLoading(true);
    try {
      const results = await searchProducts(term);
      setProducts(results);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts('');
  }, [fetchProducts]);

  useEffect(() => {
    getMyPermissions()
      .then(({ role, permissions }) => {
        setCanOverridePrice(role === 'SUPERADMIN' || permissions.includes('OVERRIDE_PRICE'));
      })
      .catch((error) => console.error('Failed to load permissions:', error));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    fetchProducts(value);
  };

  const handleBarcodeSearch = async () => {
    const barcode = barcodeInput.trim();
    if (!barcode) return;
    setSearchTerm(barcode);
    await fetchProducts(barcode);
    setBarcodeInput('');
    searchRef.current?.focus();
  };

  const handleBarcodeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBarcodeSearch();
    }
  };

  const handlePhoneBlur = async () => {
    if (!customerPhone.trim()) {
      setMatchedCustomer(null);
      setRedeemPoints(0);
      return;
    }
    setCustomerLookupLoading(true);
    try {
      const customer = await findCustomerByPhone(customerPhone);
      setMatchedCustomer(customer);
      if (!customer) setRedeemPoints(0);
      if (customer && !customerName.trim()) setCustomerName(customer.name);
    } catch (error) {
      console.error('Customer lookup failed:', error);
    } finally {
      setCustomerLookupLoading(false);
    }
  };

  const addToCart = (product: any) => {
    if (resumingBillId) {
      addToast('error', 'Items are locked while resuming a held bill. Cancel the resume to edit the cart.');
      return;
    }
    if (product.stock <= 0 && product.productType !== 'SERVICE') {
      addToast('error', `${product.name} is out of stock!`);
      return;
    }

    if (['VARIANT', 'BATCH', 'SERIAL', 'WEIGHT'].includes(product.productType)) {
      setSelectedComplexProduct(product);
      return;
    }

    confirmAddToCart(product, {
      quantity: 1,
      salePrice: product.salePrice,
      titleOverride: product.name,
      purchasePrice: product.purchasePrice,
      mrp: product.mrp
    });
  };

  const confirmAddToCart = (product: any, selectionData: any) => {
    const { 
      variantId, batchId, serialId, quantity, salePrice, 
      titleOverride, purchasePrice, mrp 
    } = selectionData;

    const existingItemIndex = product.productType === 'SERIAL' ? -1 : cart.findIndex(item => 
      item.productId === product.id && 
      item.variantId === variantId && 
      item.batchId === batchId
    );

    if (existingItemIndex >= 0) {
      const newCart = [...cart];
      const newQty = newCart[existingItemIndex].quantity + quantity;
      
      newCart[existingItemIndex] = {
        ...newCart[existingItemIndex],
        quantity: newQty,
        itemTotal: newQty * newCart[existingItemIndex].salePrice
      };
      setCart(newCart);
      addToast('success', `${titleOverride} quantity updated`);
    } else {
      const newItem = {
        id: Math.random().toString(36).substr(2, 9),
        productId: product.id,
        name: titleOverride || product.name,
        barcode: product.barcode,
        purchasePrice: purchasePrice || product.purchasePrice,
        mrp: mrp || product.mrp,
        salePrice: salePrice || product.salePrice,
        quantity: quantity,
        itemTotal: (salePrice || product.salePrice) * quantity,
        discountAmount: 0,
        maxStock: product.stock,
        stock: product.stock,
        variantId,
        batchId,
        serialId,
        productType: product.productType,
        imageUrl: product.imageUrl
      };
      setCart([...cart, newItem]);
      addToast('success', `${newItem.name} added to cart`);
    }
    
    setSelectedComplexProduct(null);
    setTimeout(() => cartRef.current?.scrollTo({ top: cartRef.current.scrollHeight, behavior: 'smooth' }), 100);
  };

  const removeFromCart = (itemId: string) => {
    if (resumingBillId) return;
    const item = cart.find(i => i.id === itemId);
    setCart(cart.filter(item => item.id !== itemId));
    if (item) addToast('info', `${item.name} removed from cart`);
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (resumingBillId) return;
    const item = cart.find(i => i.id === itemId);
    if (!item) return;
    if (quantity < 1) return;
    if (quantity > item.stock) {
      addToast('error', `Only ${item.stock} units available`);
      return;
    }

    const newCart = cart.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          quantity,
          itemTotal: quantity * item.salePrice
        };
      }
      return item;
    });
    setCart(newCart);
  };

  const updateSalePrice = (itemId: string, salePrice: number) => {
    if (resumingBillId) return;
    const newCart = cart.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          salePrice,
          itemTotal: item.quantity * salePrice
        };
      }
      return item;
    });
    setCart(newCart);
  };

  const updateItemDiscount = (itemId: string, rawDiscount: number) => {
    if (resumingBillId) return;
    const newCart = cart.map(item => {
      if (item.id === itemId) {
        const clamped = Math.max(0, Math.min(rawDiscount || 0, item.itemTotal));
        return { ...item, discountAmount: clamped };
      }
      return item;
    });
    setCart(newCart);
  };

  const clearCart = () => {
    if (cart.length === 0 && !resumingBillId) return;
    const wasResuming = !!resumingBillId;
    setCart([]);
    setAmountReceived('');
    setCouponCode('');
    setRedeemPoints(0);
    setSplitPayment(false);
    setPaymentRows([{ method: 'CASH', amount: '' }, { method: 'UPI', amount: '' }]);
    if (wasResuming) {
      // A resumed bill's discount/customer fields were populated from the held record — reset
      // them along with the cart so cancelling doesn't leave stale values behind.
      setDiscount(0);
      setCustomerName('');
      setCustomerPhone('');
      setMatchedCustomer(null);
      setResumingBillId(null);
    }
    addToast('info', wasResuming ? 'Resume cancelled — bill is still held' : 'Cart cleared');
  };

  const subtotal = cart.reduce((sum, item) => sum + parseFloat(item.itemTotal), 0);
  const itemDiscountTotal = cart.reduce((sum, item) => sum + (item.discountAmount || 0), 0);
  const afterItemDiscounts = subtotal - itemDiscountTotal;
  const discountAmount = (afterItemDiscounts * discount) / 100;
  const maxRedeemablePoints = matchedCustomer?.loyaltyPoints || 0;
  const loyaltyDiscountPreview = Math.min(redeemPoints, maxRedeemablePoints);
  // Coupon eligibility/amount is computed server-side (depends on category + minimum-quantity
  // rules); this preview intentionally excludes it so it can't drift from the authoritative total.
  const netAmount = Math.max(0, afterItemDiscounts - discountAmount - loyaltyDiscountPreview);
  const parsedAmountReceived = parseFloat(amountReceived) || 0;
  const changeAmount = parsedAmountReceived - netAmount;

  const addPaymentRow = () => setPaymentRows([...paymentRows, { method: 'CASH', amount: '' }]);
  const removePaymentRow = (idx: number) => setPaymentRows(paymentRows.filter((_, i) => i !== idx));
  const updatePaymentRow = (idx: number, field: 'method' | 'amount', value: string) => {
    setPaymentRows(paymentRows.map((row, i) => (i === idx ? { ...row, [field]: value } : row)));
  };
  const splitPaidTotal = paymentRows.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);
  const splitRemaining = netAmount - splitPaidTotal;

  const handleSubmit = async () => {
    if (cart.length === 0) {
      setSubmitError('Please add items to the cart before submitting');
      return;
    }

    let paymentsToSend: { method: string; amount: number }[] | undefined;
    if (splitPayment) {
      paymentsToSend = paymentRows
        .filter(row => (parseFloat(row.amount) || 0) > 0)
        .map(row => ({ method: row.method, amount: parseFloat(row.amount) }));
      if (paymentsToSend.length === 0) {
        setSubmitError('Enter at least one payment amount');
        return;
      }
      if (splitPaidTotal < netAmount) {
        setSubmitError(`Payments (₹${splitPaidTotal.toFixed(2)}) do not cover the net total (₹${netAmount.toFixed(2)})`);
        return;
      }
    }

    setSubmitLoading(true);
    setSubmitError(null);

    try {
      const paymentPayload = {
        paymentMethod: splitPayment ? undefined : paymentMethod,
        amountReceived: splitPayment ? undefined : (parsedAmountReceived || undefined),
        changeAmount: splitPayment ? undefined : (changeAmount > 0 ? changeAmount : undefined),
        payments: paymentsToSend,
      };

      // A resumed held bill is finalized through /resume, which re-validates stock/coupon/loyalty
      // against the held record itself and only accepts payment info — item/discount/customer
      // edits aren't possible here (see resumingBillId guards above), so only payment goes over.
      const response = resumingBillId
        ? await fetch(`/api/transactions/${resumingBillId}/resume`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paymentPayload),
          })
        : await fetch('/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: cart.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                salePrice: item.salePrice,
                discountAmount: item.discountAmount || 0,
                variantId: item.variantId,
                batchId: item.batchId,
                serialId: item.serialId,
                titleOverride: item.name,
                purchasePrice: item.purchasePrice,
                mrp: item.mrp,
                productType: item.productType
              })),
              discount,
              customerId: matchedCustomer?.id || undefined,
              customerName: customerName || undefined,
              customerPhone: customerPhone || undefined,
              couponCode: couponCode.trim() || undefined,
              loyaltyPointsRedeemed: redeemPoints > 0 ? redeemPoints : undefined,
              ...paymentPayload,
            }),
          });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create bill');
      }

      addToast('success', 'Bill created successfully!');
      setResumingBillId(null);
      router.push(`/billing/${data.transaction.id}`);
    } catch (err: any) {
      setSubmitError(err.message || 'An error occurred while creating the bill');
      addToast('error', err.message || 'Failed to create bill');
    } finally {
      setSubmitLoading(false);
    }
  };

  const holdCurrentBill = async () => {
    if (cart.length === 0) {
      setSubmitError('Add items to the cart before holding a bill');
      return;
    }
    if (resumingBillId) {
      setSubmitError('This bill is already held. Complete the sale or cancel the resume first.');
      return;
    }
    setHoldLoading(true);
    setSubmitError(null);
    try {
      const itemsToSend = cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        salePrice: item.salePrice,
        discountAmount: item.discountAmount || 0,
        variantId: item.variantId,
        batchId: item.batchId,
        serialId: item.serialId,
        titleOverride: item.name,
        purchasePrice: item.purchasePrice,
        mrp: item.mrp,
        productType: item.productType
      }));

      const response = await fetch('/api/transactions/hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: itemsToSend,
          discount,
          customerId: matchedCustomer?.id || undefined,
          customerName: customerName || undefined,
          customerPhone: customerPhone || undefined,
          couponCode: couponCode.trim() || undefined,
          loyaltyPointsRedeemed: redeemPoints > 0 ? redeemPoints : undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to hold bill');
      }
      addToast('success', 'Bill held. You can resume it from "Held Bills".');
      setCart([]);
      setAmountReceived('');
      setCouponCode('');
      setRedeemPoints(0);
      setMatchedCustomer(null);
      setCustomerName('');
      setCustomerPhone('');
      setDiscount(0);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to hold bill');
      addToast('error', err.message || 'Failed to hold bill');
    } finally {
      setHoldLoading(false);
    }
  };

  const loadHeldBills = async () => {
    setHeldBillsLoading(true);
    try {
      const response = await fetch('/api/transactions/held');
      const data = await response.json();
      if (response.ok) setHeldBills(data.heldBills || []);
    } catch (err) {
      console.error('Failed to load held bills:', err);
    } finally {
      setHeldBillsLoading(false);
    }
  };

  const openHeldBills = () => {
    setShowHeldBills(true);
    loadHeldBills();
  };

  // Loads a held bill for review/payment without deleting it — the held record is only removed
  // once /api/transactions/[id]/resume actually completes the sale (see handleSubmit), so an
  // abandoned or failed resume leaves the bill safely held instead of silently lost. Item edits
  // are locked (see resumingBillId guards above) because the resume endpoint re-finalizes exactly
  // what's stored on the held record, not whatever the cart happens to show.
  const resumeHeldBill = async (bill: any) => {
    if (cart.length > 0) {
      const proceed = window.confirm('Loading a held bill will replace your current cart. Continue?');
      if (!proceed) return;
    }
    const restoredCart = bill.items.map((item: any) => ({
      id: Math.random().toString(36).substr(2, 9),
      productId: item.productId,
      name: item.name,
      barcode: item.barcode,
      purchasePrice: item.purchasePrice,
      mrp: item.mrp,
      salePrice: item.salePrice,
      quantity: item.quantity,
      itemTotal: item.itemTotal,
      discountAmount: item.discountAmount || 0,
      maxStock: item.quantity,
      stock: item.quantity,
      variantId: item.variantId,
      batchId: item.batchId,
      serialId: item.serialId,
      productType: item.productType,
    }));
    setCart(restoredCart);
    setDiscount(bill.discount || 0);
    setCustomerName(bill.customerName || '');
    setCustomerPhone(bill.customerPhone || '');
    setCouponCode(bill.couponCode || '');
    setRedeemPoints(bill.loyaltyPointsRedeemed || 0);
    setResumingBillId(bill.id);
    setShowHeldBills(false);

    if (bill.customerPhone) {
      setCustomerLookupLoading(true);
      try {
        const customer = await findCustomerByPhone(bill.customerPhone);
        setMatchedCustomer(customer);
      } catch (err) {
        console.error('Customer lookup failed:', err);
      } finally {
        setCustomerLookupLoading(false);
      }
    } else {
      setMatchedCustomer(null);
    }

    addToast('success', 'Held bill loaded — choose a payment method to complete the sale');
  };

  const deleteHeldBillHandler = async (billId: string) => {
    try {
      const response = await fetch(`/api/transactions/${billId}`, { method: 'DELETE' });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete held bill');
      }
      setHeldBills(heldBills.filter(b => b.id !== billId));
      if (resumingBillId === billId) {
        // The bill currently loaded for resume was deleted out from under us — drop it from the
        // cart too so "Complete Sale" doesn't try to resume a held record that no longer exists.
        clearCart();
      }
      addToast('info', 'Held bill deleted');
    } catch (err: any) {
      addToast('error', err.message || 'Failed to delete held bill');
    }
  };

  const startCameraScan = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setScanning(true);
        scanBarcode();
      }
    } catch (err) {
      addToast('error', 'Camera access denied. Please use manual barcode input.');
      setScanning(false);
    }
  };

  const scanBarcode = () => {
    if ('BarcodeDetector' in window) {
      const BarcodeDetectorCtor = (window as unknown as {
        BarcodeDetector: new (opts: { formats: string[] }) => {
          detect(video: HTMLVideoElement): Promise<{ rawValue: string }[]>;
        };
      }).BarcodeDetector;
      const detector = new BarcodeDetectorCtor({ formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'qr_code'] });
      const detect = async () => {
        if (!videoRef.current || !scanning) return;
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes.length > 0) {
            const code = barcodes[0].rawValue;
            stopCamera();
            setBarcodeInput(code);
            setSearchTerm(code);
            await fetchProducts(code);
            addToast('success', `Scanned: ${code}`);
          }
        } catch (e) {
        }
        scannerRef.current = window.setTimeout(detect, 500);
      };
      detect();
    } else {
      addToast('info', 'Barcode scanner not supported in this browser. Try Chrome on Android.');
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (scannerRef.current) {
      clearTimeout(scannerRef.current);
      scannerRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) clearTimeout(scannerRef.current);
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const selectedPayment = PAYMENT_METHODS.find(p => p.value === paymentMethod);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Bill</h1>
          <p className="text-sm text-gray-500 mt-0.5">Search or scan items and add them to the bill</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openHeldBills}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
          >
            <PauseCircle className="w-4 h-4" />
            Held Bills
          </button>
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono border border-gray-200">Ctrl+K</kbd>
            <span>Focus search</span>
          </div>
        </div>
      </header>

      {submitError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2.5 rounded-xl mb-4 flex items-center gap-2.5 text-sm shrink-0">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{submitError}</span>
          <button onClick={() => setSubmitError(null)} className="p-0.5 hover:bg-rose-100 rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
        {/* Left: Search + Products */}
        <section className="lg:col-span-4 flex flex-col min-h-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col flex-1 min-h-0">
            {/* Barcode Input */}
            <div className="mb-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    ref={barcodeRef}
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={handleBarcodeKeyDown}
                    placeholder="Scan or enter barcode..."
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-gray-900 text-sm transition-all"
                  />
                </div>
                <button
                  onClick={handleBarcodeSearch}
                  className="px-3 py-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
                  title="Search barcode"
                >
                  <Search className="w-4 h-4" />
                </button>
                <button
                  onClick={scanning ? stopCamera : startCameraScan}
                  className={`px-3 py-2.5 rounded-xl transition-colors ${
                    scanning ? 'bg-rose-100 text-rose-600 hover:bg-rose-200' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                  }`}
                  title={scanning ? 'Stop camera' : 'Scan with camera'}
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Camera Preview */}
            {scanning && (
              <div className="relative rounded-xl overflow-hidden border-2 border-indigo-300 mb-4 shrink-0">
                <video ref={videoRef} autoPlay className="w-full h-36 object-cover" />
                <button
                  onClick={stopCamera}
                  className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-black/80 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  Scanning...
                </div>
              </div>
            )}

            {/* Search */}
            <div className="mb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Search items by name..."
                  className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-gray-900 text-sm transition-all"
                />
                {searchLoading && (
                  <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="h-4 w-4 text-gray-400 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  </span>
                )}
              </div>
            </div>

            {/* Product List */}
            <div className="flex-1 min-h-0 overflow-y-auto space-y-2 -mx-1 px-1">
              {searchLoading && products.length === 0 && (
                <div className="flex items-center justify-center py-16 text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-8 h-8 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    <span className="text-sm">Searching...</span>
                  </div>
                </div>
              )}

              {!searchLoading && products.length === 0 && searchTerm && (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <Package className="w-10 h-10 mb-2" />
                  <p className="text-sm font-medium">No products found</p>
                  <p className="text-xs mt-0.5">Try a different search term or scan a barcode</p>
                </div>
              )}

              {!searchLoading && !searchTerm && products.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <Package className="w-10 h-10 mb-2" />
                  <p className="text-sm font-medium">No products yet</p>
                  <p className="text-xs mt-0.5">Add products first to start billing</p>
                </div>
              )}

              {products.length > 0 && products.map(product => (
                <button
                  key={product.id}
                  onClick={() => product.stock > 0 && addToCart(product)}
                  disabled={product.stock <= 0 && product.productType !== 'SERVICE'}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    product.stock <= 0 && product.productType !== 'SERVICE'
                      ? 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed'
                      : 'bg-white border-gray-100 hover:border-indigo-200 hover:shadow-sm hover:bg-indigo-50/30 active:scale-[0.99] cursor-pointer'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center shrink-0 border border-indigo-100/50">
                      <Package className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-medium text-gray-900 text-sm truncate">{product.name}</h3>
                        <span className="text-sm font-bold text-indigo-600 shrink-0">₹{product.salePrice.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {product.productType !== 'SIMPLE' && product.productType !== 'SERVICE' && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200/50 uppercase tracking-wide">{product.productType}</span>
                        )}
                        <span className={`text-xs ${
                          product.stock > 10 ? 'text-green-600' : product.stock > 0 ? 'text-amber-600' : 'text-red-500'
                        }`}>
                          {product.productType === 'SERVICE' ? 'Service' : `${product.stock} in stock`}
                        </span>
                      </div>
                      {product.barcode && (
                        <p className="text-[10px] text-gray-400 mt-0.5 font-mono">{product.barcode}</p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Middle: Cart */}
        <section className="lg:col-span-4 flex flex-col min-h-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-indigo-500" />
                Cart
                {cart.length > 0 && (
                  <span className="text-sm font-normal text-gray-500">({totalItems} items)</span>
                )}
              </h2>
              {cart.length > 0 && (
                <div className="flex items-center gap-3">
                  {!resumingBillId && (
                    <button
                      onClick={holdCurrentBill}
                      disabled={holdLoading}
                      className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1 transition-colors font-medium disabled:opacity-50"
                    >
                      <PauseCircle className="w-3.5 h-3.5" />
                      {holdLoading ? 'Holding...' : 'Hold'}
                    </button>
                  )}
                  <button
                    onClick={clearCart}
                    className="text-sm text-rose-500 hover:text-rose-700 flex items-center gap-1 transition-colors font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {resumingBillId ? 'Cancel Resume' : 'Clear'}
                  </button>
                </div>
              )}
            </div>

            {resumingBillId && (
              <div className="mb-4 shrink-0 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 flex items-center gap-2">
                <PlayCircle className="w-4 h-4 shrink-0" />
                <span>Resuming a held bill — items are locked. Choose a payment method and complete the sale, or cancel to leave it held.</span>
              </div>
            )}

            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-8">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4 border border-gray-100">
                  <ShoppingCart className="w-7 h-7" />
                </div>
                <p className="text-sm font-medium text-gray-500">Cart is empty</p>
                <p className="text-xs mt-1 text-center max-w-[200px]">Search products or scan barcodes to add items</p>
              </div>
            ) : (
              <div ref={cartRef} className="flex-1 overflow-y-auto space-y-2.5 -mx-1 px-1">
                {cart.map(item => (
                  <div key={item.id} className="bg-gray-50 rounded-xl p-3 border border-gray-100 group">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                          <Package className="w-4 h-4 text-gray-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-medium text-gray-900 truncate">{item.name}</h3>
                          <p className="text-xs text-gray-400">₹{item.salePrice.toFixed(2)} / unit</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 text-gray-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-2.5">
                      <div className="flex items-center border border-gray-200 rounded-lg bg-white overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity === 1}
                          className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-30 text-gray-600"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <div className="w-9 text-center text-sm font-semibold text-gray-900 tabular-nums">{item.quantity}</div>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                          className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-30 text-gray-600"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">₹</span>
                          <input
                            type="number"
                            value={item.salePrice}
                            onChange={(e) => updateSalePrice(item.id, parseFloat(e.target.value) || 0)}
                            disabled={!!resumingBillId || !canOverridePrice}
                            title={!canOverridePrice ? "You don't have permission to change the sale price" : undefined}
                            className="w-16 pl-4 pr-1 py-1.5 text-xs border border-gray-200 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 text-gray-900 bg-white tabular-nums disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>
                        <span className="font-bold text-gray-900 text-sm min-w-[4rem] text-right tabular-nums">
                          ₹{parseFloat(item.itemTotal).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-1.5 mt-2">
                      <Tag className="w-3 h-3 text-gray-400" />
                      <span className="text-[11px] text-gray-400">Item discount</span>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">₹</span>
                        <input
                          type="number"
                          min={0}
                          max={item.itemTotal}
                          value={item.discountAmount || ''}
                          onChange={(e) => updateItemDiscount(item.id, parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="w-16 pl-4 pr-1 py-1 text-xs border border-gray-200 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 text-gray-900 bg-white tabular-nums"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Right: Order Summary */}
        <section className="lg:col-span-4 flex flex-col min-h-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col flex-1 min-h-0">
            <h2 className="text-lg font-bold text-gray-900 mb-4 shrink-0">Order Summary</h2>

            <div className="flex-1 overflow-y-auto space-y-4">
              {/* Customer Info */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50/50 rounded-xl p-3.5 border border-indigo-100/50">
                <div className="flex items-center gap-2 mb-2.5">
                  <User className="w-4 h-4 text-indigo-500" />
                  <span className="text-sm font-semibold text-gray-800">Customer</span>
                </div>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer name (optional)"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 bg-white mb-2 text-gray-900"
                />
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  onBlur={handlePhoneBlur}
                  placeholder="Phone number (optional)"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 bg-white text-gray-900"
                />
                {customerLookupLoading && (
                  <p className="text-xs text-gray-400 mt-1.5">Looking up customer...</p>
                )}
                {!customerLookupLoading && matchedCustomer && (
                  <div className="mt-2.5 bg-white rounded-lg p-2.5 border border-indigo-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-amber-600 font-medium">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {matchedCustomer.loyaltyPoints} points available
                      </span>
                    </div>
                    {matchedCustomer.loyaltyPoints > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="number"
                          min={0}
                          max={matchedCustomer.loyaltyPoints}
                          value={redeemPoints || ''}
                          onChange={(e) => setRedeemPoints(Math.max(0, Math.min(parseInt(e.target.value) || 0, matchedCustomer.loyaltyPoints)))}
                          disabled={!!resumingBillId}
                          placeholder="0"
                          className="w-20 px-2 py-1.5 text-xs border border-gray-200 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 text-gray-900 bg-white tabular-nums disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <span className="text-xs text-gray-500">points to redeem (₹{loyaltyDiscountPreview.toFixed(2)} off)</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal ({totalItems} items)</span>
                  <span className="font-medium text-gray-900 tabular-nums">₹{subtotal.toFixed(2)}</span>
                </div>

                {itemDiscountTotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Item discounts</span>
                    <span className="text-emerald-600 font-medium tabular-nums">-₹{itemDiscountTotal.toFixed(2)}</span>
                  </div>
                )}

                <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                  <label className="flex items-center justify-between text-sm text-gray-600 mb-1.5">
                    <span>Bill Discount</span>
                    <span className="text-xs text-gray-400">{discount}%</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    disabled={!!resumingBillId}
                    className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="flex justify-between text-xs mt-1.5">
                    <span className="text-gray-400">0%</span>
                    {discount > 0 && (
                      <span className="text-emerald-600 font-medium">-₹{discountAmount.toFixed(2)}</span>
                    )}
                    <span className="text-gray-400">100%</span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                  <label className="text-sm text-gray-600 mb-1.5 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-gray-400" />
                    Coupon Code
                  </label>
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    disabled={!!resumingBillId}
                    placeholder="e.g. DIWALI10"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 bg-white text-gray-900 uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {couponCode && (
                    <p className="text-[11px] text-gray-400 mt-1">Validated and applied when the bill is created.</p>
                  )}
                </div>

                {loyaltyDiscountPreview > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Loyalty points redeemed</span>
                    <span className="text-emerald-600 font-medium tabular-nums">-₹{loyaltyDiscountPreview.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
                  <span>Net Total</span>
                  <span className="tabular-nums">₹{netAmount.toFixed(2)}</span>
                </div>
                {couponCode && (
                  <p className="text-[11px] text-gray-400 -mt-2">Excludes coupon discount, calculated at checkout.</p>
                )}
              </div>

              {/* Payment Method */}
              <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 block">Payment Method</label>
                  <button
                    onClick={() => setSplitPayment(!splitPayment)}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    {splitPayment ? 'Use single method' : 'Split payment'}
                  </button>
                </div>

                {!splitPayment ? (
                  <div className="grid grid-cols-4 gap-2">
                    {PAYMENT_METHODS.map(pm => {
                      const Icon = pm.icon;
                      const isSelected = paymentMethod === pm.value;
                      return (
                        <button
                          key={pm.value}
                          onClick={() => setPaymentMethod(pm.value)}
                          className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border text-xs font-medium transition-all ${
                            isSelected
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {pm.label}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {paymentRows.map((row, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <select
                          value={row.method}
                          onChange={(e) => updatePaymentRow(idx, 'method', e.target.value)}
                          className="px-2 py-2 text-xs border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                        >
                          {PAYMENT_METHODS.map(pm => (
                            <option key={pm.value} value={pm.value}>{pm.label}</option>
                          ))}
                        </select>
                        <div className="relative flex-1">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
                          <input
                            type="number"
                            value={row.amount}
                            onChange={(e) => updatePaymentRow(idx, 'amount', e.target.value)}
                            placeholder="0.00"
                            className="w-full pl-6 pr-2 py-2 text-sm border border-gray-200 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 text-gray-900 bg-white tabular-nums"
                          />
                        </div>
                        {paymentRows.length > 1 && (
                          <button onClick={() => removePaymentRow(idx)} className="text-gray-300 hover:text-rose-500 p-1">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={addPaymentRow}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add payment
                    </button>
                    <div className="flex justify-between text-xs pt-1.5 border-t border-gray-200">
                      <span className="text-gray-500">Paid</span>
                      <span className="font-medium text-gray-900 tabular-nums">₹{splitPaidTotal.toFixed(2)}</span>
                    </div>
                    {splitRemaining > 0.01 && (
                      <p className="text-xs text-amber-600 font-medium">Short: ₹{splitRemaining.toFixed(2)}</p>
                    )}
                    {splitRemaining < -0.01 && (
                      <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" /> Change due: ₹{Math.abs(splitRemaining).toFixed(2)}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Amount Received */}
              {!splitPayment && (
                <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                    Amount Received
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                    <input
                      type="number"
                      value={amountReceived}
                      onChange={(e) => setAmountReceived(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-7 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 bg-white text-gray-900 tabular-nums"
                    />
                  </div>
                  {parsedAmountReceived >= netAmount && netAmount > 0 && (
                    <p className="text-xs text-emerald-600 font-medium mt-1.5 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Change due: ₹{changeAmount.toFixed(2)}
                    </p>
                  )}
                  {parsedAmountReceived > 0 && parsedAmountReceived < netAmount && (
                    <p className="text-xs text-amber-600 font-medium mt-1.5">
                      Short: ₹{(netAmount - parsedAmountReceived).toFixed(2)}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="mt-4 shrink-0">
              <button
                onClick={handleSubmit}
                disabled={cart.length === 0 || submitLoading || (splitPayment && splitRemaining > 0.01)}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm hover:shadow-md active:scale-[0.99]"
              >
                {submitLoading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    {resumingBillId ? 'Completing Sale...' : 'Creating Bill...'}
                  </>
                ) : (
                  <>
                    <Printer className="w-5 h-5" />
                    {resumingBillId ? 'Complete Sale & Print' : 'Create Bill & Print'}
                  </>
                )}
              </button>
              <p className="text-xs text-center text-gray-400 mt-1.5">
                {cart.length === 0
                  ? 'Add items to the cart to create a bill'
                  : `${cart.length} items · ₹${netAmount.toFixed(2)} total`
                }
              </p>
            </div>
          </div>
        </section>
      </div>

      {selectedComplexProduct && (
        <ProductSelectionModal
          product={selectedComplexProduct}
          onClose={() => setSelectedComplexProduct(null)}
          onConfirm={(data) => confirmAddToCart(selectedComplexProduct, data)}
        />
      )}

      {showHeldBills && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <PauseCircle className="w-5 h-5 text-amber-500" />
                Held Bills
              </h2>
              <button onClick={() => setShowHeldBills(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {heldBillsLoading ? (
                <div className="flex items-center justify-center py-12 text-gray-400">
                  <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                </div>
              ) : heldBills.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <PauseCircle className="w-10 h-10 mb-2" />
                  <p className="text-sm font-medium">No held bills</p>
                  <p className="text-xs mt-0.5">Hold a bill from the billing screen to see it here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {heldBills.map(bill => (
                    <div key={bill.id} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {bill.customerName || 'Walk-in customer'}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {bill.items.length} item{bill.items.length === 1 ? '' : 's'} · ₹{bill.netAmount.toFixed(2)}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            Held {new Date(bill.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => resumeHeldBill(bill)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                          >
                            <PlayCircle className="w-3.5 h-3.5" />
                            Resume
                          </button>
                          <button
                            onClick={() => deleteHeldBillHandler(bill.id)}
                            className="p-1.5 text-gray-400 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
