'use client';

import React, { useState } from 'react';
import { ProductItem } from '@/app/actions/products';
import { createOrderAction } from '@/app/actions/orders';
import { X, Trash2, ShoppingCart, ArrowRight, CheckCircle2, Truck, AlertCircle } from 'lucide-react';

export interface CartItem {
  product: ProductItem;
  quantity: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
}

export function CartDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}: CartDrawerProps) {
  const [shippingAddress, setShippingAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{ orderId: string; totalAmount: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const total = items.reduce(
    (acc, item) => acc + parseFloat(item.product.price) * item.quantity,
    0
  );

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    if (!shippingAddress.trim()) {
      setErrorMessage('Please provide a valid shipping address.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const orderPayload = {
      shippingAddress,
      items: items.map((i) => ({
        productId: i.product.id,
        quantity: i.quantity,
        price: i.product.price,
      })),
    };

    const res = await createOrderAction(orderPayload);
    setIsSubmitting(false);

    if (res.success && res.orderId) {
      setOrderSuccess({ orderId: res.orderId, totalAmount: res.totalAmount || total.toFixed(2) });
      onClearCart();
    } else {
      setErrorMessage(res.message || 'Failed to process order. Check inputs.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm transition-opacity">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 text-white shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-white">Your Shopping Cart</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {orderSuccess ? (
              <div className="text-center py-12 space-y-4">
                <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto animate-bounce" />
                <h3 className="text-xl font-bold text-white">Order Confirmed!</h3>
                <p className="text-xs text-slate-400">
                  Your order ID <code className="text-indigo-300 font-mono">{orderSuccess.orderId}</code> has been processed via standard Drizzle ORM Server Actions.
                </p>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Paid:</span>
                    <span className="font-bold text-emerald-400">${orderSuccess.totalAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status:</span>
                    <span className="font-semibold text-indigo-400">Processing / Paid</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setOrderSuccess(null);
                    onClose();
                  }}
                  className="w-full py-3 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white text-sm"
                >
                  Back to Store
                </button>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-20 text-slate-500 space-y-3">
                <ShoppingCart className="w-12 h-12 mx-auto text-slate-700" />
                <p className="text-sm font-medium">Your cart is currently empty</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-slate-950/80 border border-slate-800"
                  >
                    <div className="space-y-1">
                      <h4 className="font-semibold text-sm text-white line-clamp-1">{item.product.name}</h4>
                      <p className="text-xs text-slate-400 font-mono">
                        ${parseFloat(item.product.price).toFixed(2)} x {item.quantity}
                      </p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1 border border-slate-800 rounded-lg bg-slate-900 px-2 py-1 text-xs">
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, -1)}
                          className="px-1 text-slate-400 hover:text-white"
                        >
                          -
                        </button>
                        <span className="px-1 font-bold text-white">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, 1)}
                          className="px-1 text-slate-400 hover:text-white"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => onRemoveItem(item.product.id)}
                        className="text-slate-500 hover:text-red-400 transition-colors p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Checkout Form */}
                <form onSubmit={handleCheckout} className="pt-6 border-t border-slate-800 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center">
                      <Truck className="w-3.5 h-3.5 mr-1.5 text-indigo-400" /> Shipping Address
                    </label>
                    <textarea
                      rows={2}
                      required
                      placeholder="123 Tech Blvd, Suite 400, San Francisco, CA"
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  {errorMessage && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-800 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Subtotal:</span>
                      <span className="font-bold text-white">${total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Standard Shipping:</span>
                      <span className="font-semibold text-emerald-400">FREE</span>
                    </div>
                    <div className="flex justify-between text-base font-extrabold pt-2 border-t border-slate-800 text-white">
                      <span>Total:</span>
                      <span className="text-indigo-400">${total.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 rounded-xl font-bold text-slate-950 bg-white hover:bg-slate-100 transition-all shadow-lg active:scale-95 flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
                  >
                    <span>{isSubmitting ? 'Validating Order...' : 'Place Order via Server Action'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
