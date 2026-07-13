"use client";

import { useCart } from './CartContext';
import { ShoppingCart, X, Trash2, Plus, Minus, MapPin, ExternalLink, LogIn, Mail, Lock, Phone, User } from 'lucide-react';
import { getDirectionsUrl } from '@/app/menu/[tenantId]/menuUtils';
import type { MenuTheme } from '@/app/menu/[tenantId]/menuThemes';

export function OrderSuccessToast({ theme }: { theme?: MenuTheme }) {
  const { orderSuccess } = useCart();
  if (!orderSuccess) return null;
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-xl animate-slide-up flex items-center gap-2">
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      <span className="text-sm font-black">Order placed! Store will review.</span>
    </div>
  );
}

export function FloatingCartBar({ theme }: { theme?: MenuTheme }) {
  const { cartCount, cartTotal, setShowCart } = useCart();
  const isRestaurant = theme?.id === 'RESTAURANT';
  if (cartCount === 0) return null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.15)] ${isRestaurant ? 'bg-orange-500' : 'bg-gray-900 border-t border-black/20'}`}>
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <ShoppingCart className={`w-5 h-5 ${isRestaurant ? 'text-white' : 'text-yellow-400'}`} />
            <span className="absolute -top-2 -right-2 bg-yellow-400 text-gray-900 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">{cartCount}</span>
          </div>
          <div>
            <p className={`text-xs font-bold ${isRestaurant ? 'text-white' : 'text-white'}`}>{cartCount} item{cartCount > 1 ? 's' : ''}</p>
            <p className={`text-[10px] ${isRestaurant ? 'text-white opacity-75' : 'text-gray-400'}`}>₹{cartTotal.toFixed(2)}</p>
          </div>
        </div>
        <button onClick={() => setShowCart(true)}
          className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all active:scale-95 shadow-sm ${
            isRestaurant ? 'bg-white text-orange-500' : 'bg-yellow-400 text-gray-900'
          }`}>
          View {isRestaurant ? 'Order' : 'Cart'} →
        </button>
      </div>
    </div>
  );
}

export function CartDrawer({ tenant, theme }: { tenant: any; theme?: MenuTheme }) {
  const { cart, showCart, setShowCart, removeFromCart, updateQuantity, cartCount, cartTotal, handlePlaceOrder, submitting, isLoggedIn } = useCart();
  if (!showCart) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setShowCart(false)} />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white text-gray-900 shadow-2xl flex flex-col animate-slide-in-right">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-gray-900" />
            <h2 className="text-lg font-black font-sans">Your Order</h2>
            <span className="bg-gray-900 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{cartCount}</span>
          </div>
          <button onClick={() => setShowCart(false)} className="p-2 hover:bg-black/5 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {cart.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-semibold">Cart is empty</p>
              <p className="text-xs mt-1">Add items from the menu</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map(item => (
                <div key={`${item.productId}:${item.variantId || ''}`} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{item.name}</p>
                    <p className="text-[10px] text-gray-500">₹{item.salePrice.toFixed(2)} each</p>
                  </div>
                  <div className="flex items-center gap-0 bg-gray-200 rounded-xl overflow-hidden">
                    <button onClick={() => item.quantity === 1 ? removeFromCart(item.productId, item.variantId) : updateQuantity(item.productId, -1, item.variantId)}
                      className="w-8 h-8 flex items-center justify-center text-gray-700 hover:bg-gray-300">
                      {item.quantity === 1 ? <Trash2 className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                    </button>
                    <span className="text-xs font-black text-gray-900 min-w-[24px] text-center bg-gray-200">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.productId, 1, item.variantId)} disabled={item.quantity >= item.stock}
                      className="w-8 h-8 flex items-center justify-center text-gray-700 hover:bg-gray-300 disabled:opacity-30">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs font-black min-w-[50px] text-right">₹{(item.salePrice * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        {cart.length > 0 && (
          <div className="border-t border-gray-100 p-5 space-y-3 bg-white">
            <div className="flex justify-between text-xs text-gray-500"><span>Subtotal</span><span className="font-bold">₹{cartTotal.toFixed(2)}</span></div>
            <div className="flex justify-between font-black pt-2 border-t border-gray-100"><span>Total</span><span>₹{cartTotal.toFixed(2)}</span></div>
            {tenant.address && (
              <div className="flex items-center gap-2 text-[10px] text-gray-500 bg-gray-50 rounded-xl px-3 py-2">
                <MapPin className="w-3 h-3 flex-shrink-0 text-gray-400" />
                <span className="truncate">{tenant.address}</span>
                <a href={getDirectionsUrl(tenant)} target="_blank" rel="noopener noreferrer" className="font-bold whitespace-nowrap flex items-center gap-0.5">
                  Directions <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            )}
            <button onClick={handlePlaceOrder} disabled={submitting}
              className="w-full py-3.5 rounded-xl bg-gray-900 text-white font-black text-sm hover:opacity-90 disabled:opacity-50 transition-all shadow-md active:scale-[0.98]">
              {submitting ? 'Placing Order...' : isLoggedIn ? `Place Order — ₹${cartTotal.toFixed(2)}` : `Login to Order — ₹${cartTotal.toFixed(2)}`}
            </button>
            <p className="text-[10px] text-center text-gray-400">Pick up from store. Tax calculated at checkout.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function AuthModal({ theme }: { theme?: MenuTheme }) {
  const isRestaurant = theme?.id === 'RESTAURANT';
  const { showAuthModal, setShowAuthModal, authMode, setAuthMode, authForm, setAuthForm, authError, authLoading, handleAuth } = useCart();
  if (!showAuthModal) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setShowAuthModal(false)} />
      <div className="relative bg-white text-gray-900 rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-slide-up">
        <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-lg">
          <X className="w-5 h-5 text-gray-400" />
        </button>
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-3 bg-gray-100">
            <LogIn className="w-6 h-6 text-gray-900" />
          </div>
          <h2 className="text-lg font-black font-sans">{authMode === 'login' ? 'Sign In to Order' : 'Create Account'}</h2>
          <p className="text-xs text-gray-500 mt-1">{authMode === 'login' ? 'Sign in to place your order' : 'Register to start ordering'}</p>
        </div>
        <form onSubmit={handleAuth} className="space-y-3">
          {authError && (
            <div className={`px-3 py-2 rounded-xl text-xs font-semibold border bg-red-50 border-red-200 text-red-600`}>
              {authError}
            </div>
          )}
          {authMode === 'register' && (
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" required placeholder="Your name" value={authForm.name} onChange={(e) => setAuthForm(p => ({ ...p, name: e.target.value }))}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900" />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="email" required placeholder="Email" value={authForm.email} onChange={(e) => setAuthForm(p => ({ ...p, email: e.target.value }))}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900" />
          </div>
          {authMode === 'register' && (
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="tel" placeholder="Phone (optional)" value={authForm.phone} onChange={(e) => setAuthForm(p => ({ ...p, phone: e.target.value }))}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900" />
            </div>
          )}
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="password" required minLength={6} placeholder="Password" value={authForm.password} onChange={(e) => setAuthForm(p => ({ ...p, password: e.target.value }))}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900" />
          </div>
          <button type="submit" disabled={authLoading}
            className="w-full py-3 rounded-xl bg-gray-900 text-white font-black text-sm hover:opacity-90 disabled:opacity-50 transition-all shadow-md">
            {authLoading ? 'Please wait...' : authMode === 'login' ? 'Sign In' : 'Create Account & Sign In'}
          </button>
        </form>
        <div className="mt-4 text-center">
          <button onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); }}
            className="text-xs font-bold text-gray-500 hover:text-gray-900">
            {authMode === 'login' ? "Don't have an account? Register" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
