import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Clock,
  CheckCircle2,
  X,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { Product } from '../types.js';

interface SubstituteRecommendation {
  substituteProduct: Product;
  confidenceScore: number;
  priceDifference: number;
  matchReason: string;
  source: 'gemini-ai' | 'smart-heuristic';
}

interface AISubstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalProduct: Product | null;
  substitutes: SubstituteRecommendation[];
  onAcceptSubstitute: (originalId: string, substituteId: string) => void;
}

export const AISubstitutionModal: React.FC<AISubstitutionModalProps> = ({
  isOpen,
  onClose,
  originalProduct,
  substitutes,
  onAcceptSubstitute
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(60);

  useEffect(() => {
    if (!isOpen) {
      setSecondsRemaining(60);
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose(); // auto-dismiss when 60-second window expires
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onClose]);

  if (!isOpen || !originalProduct) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden">
        {/* Urgent Ticking Banner */}
        <div className="p-4 bg-purple-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400 fill-current" />
            <div>
              <h3 className="font-extrabold text-sm">Item Replacement Suggestion</h3>
              <p className="text-[11px] text-purple-200">An item in your order is temporarily unavailable</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-950 border border-purple-800 font-mono text-xs font-black text-amber-400">
            <Clock className="w-3.5 h-3.5 animate-spin" />
            <span>00:{secondsRemaining.toString().padStart(2, '0')}</span>
          </div>
        </div>

        {/* Original Missing Item */}
        <div className="p-4 bg-stone-50 border-b border-stone-200 flex items-center gap-3">
          <div className="relative">
            <img
              src={originalProduct.imageUrl}
              alt={originalProduct.name}
              className="w-12 h-12 rounded-xl object-cover border border-stone-300 opacity-60 grayscale"
            />
            <span className="absolute -top-1 -right-1 bg-rose-600 text-white p-0.5 rounded-full">
              <X className="w-3 h-3" />
            </span>
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
              Temporarily Out of Stock
            </span>
            <h4 className="text-xs font-bold text-stone-900 line-clamp-1">{originalProduct.name}</h4>
            <p className="text-[11px] text-stone-600">
              {originalProduct.unit} • ₹{originalProduct.price}
            </p>
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="p-5 space-y-3">
          <p className="text-xs font-extrabold text-stone-700 uppercase tracking-wider">
            Suggested Replacements Available Now
          </p>

          <div className="space-y-3">
            {substitutes.map((rec) => {
              const sub = rec.substituteProduct;
              return (
                <div
                  key={sub.id}
                  className="p-3.5 rounded-2xl border border-stone-200 hover:border-purple-300 hover:bg-purple-50/30 transition-all flex items-center justify-between gap-3 shadow-2xs"
                >
                  <img
                    src={sub.imageUrl}
                    alt={sub.name}
                    className="w-14 h-14 rounded-xl object-cover border border-stone-200 bg-white flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">
                        Top Match
                      </span>
                    </div>
                    <h5 className="text-xs font-bold text-stone-900 truncate mt-0.5">{sub.name}</h5>
                    <p className="text-[11px] text-stone-600 line-clamp-1">{rec.matchReason}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-black text-stone-900">₹{sub.price}</span>
                      <span className="text-[10px] font-medium text-stone-600">
                        {rec.priceDifference === 0
                          ? 'Same price'
                          : rec.priceDifference > 0
                          ? `+₹${rec.priceDifference} diff`
                          : `-₹${Math.abs(rec.priceDifference)} cheaper`}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onAcceptSubstitute(originalProduct.id, sub.id)}
                    className="px-3 py-2 bg-purple-700 hover:bg-purple-800 active:bg-purple-900 text-white font-extrabold text-xs rounded-xl shadow transition-all cursor-pointer flex-shrink-0"
                  >
                    Accept
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-xs font-bold text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
          >
            Decline & Refund ₹{originalProduct.price}
          </button>

          <span className="text-[10px] text-stone-600 font-mono">
            Auto-refunds in {secondsRemaining}s if no action taken
          </span>
        </div>
      </div>
    </div>
  );
};
