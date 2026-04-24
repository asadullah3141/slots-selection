"use client";

import React, { useState, useEffect } from 'react';
import { Clock, User, AlertTriangle, CheckCircle, Loader2, Calendar } from 'lucide-react';
import { bookSlot } from '@/app/actions/bookSlots';
import { getSlotAvailability } from '@/app/actions/getSlots';
import { SLOTS } from '@/app/data/slots';

export default function TestBookingPage() {
  const [fullName, setFullName] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [availability, setAvailability] = useState<Record<string, number>>({});
  
  // Status States
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch current availability from Google Sheets on load
  useEffect(() => {
    async function loadInitialData() {
      const result = await getSlotAvailability();
      if (result.success) {
        setAvailability(result.counts);
      }
      setIsPageLoading(false);
    }
    loadInitialData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !selectedSlot) return;

    setIsSubmitting(true);
    setError(null);

    const slotData = SLOTS.find(s => s.id === selectedSlot);

    const result = await bookSlot({
      fullName,
      slotId: selectedSlot,
      slotTime: slotData?.time || ""
    });

    if (result.success) {
      setIsSuccess(true);
    } else {
      setError(result.error);
      setIsSubmitting(false);
      // Refresh availability in case the error was a "Slot Full" update
      const refresh = await getSlotAvailability();
      if (refresh.success) setAvailability(refresh.counts);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10 text-center border border-gray-100">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Slot Locked!</h2>
          <p className="text-gray-600 mt-4 leading-relaxed">
            Excellent, <span className="font-semibold text-black">{fullName}</span>. 
            Your registration is complete. 
          </p>
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-500 italic">
              Remember: Changes require admin approval.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 p-8 md:p-12 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="text-blue-400 w-6 h-6" />
            <span className="text-blue-400 font-bold tracking-widest uppercase text-sm">Mock Test 2</span>
          </div>
          <h1 className="text-4xl font-black">Test Slot Selection</h1>
          <p className="text-slate-400 mt-3 text-lg">Please enter your name and select an available time window.</p>
        </div>

        {isPageLoading ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            <p className="text-slate-500 font-medium">Loading live slot availability...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-10">
            
            {/* Name Section */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" /> Student Full Name
              </label>
              <input
                required
                disabled={isSubmitting}
                type="text"
                placeholder="e.g. Johnathan Doe"
                className="text-gray-700 w-full px-5 py-4 rounded-2xl border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 outline-none transition-all text-lg"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            {/* Slots Grid */}
            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" /> Choose Your Time
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SLOTS.map((slot) => {
                  const taken = availability[String(slot.id)] || 0;
                  const remaining = slot.quota - taken;
                  const isFull = remaining <= 0;
                  const isSelected = selectedSlot === slot.id;

                  return (
                    <button
                      key={slot.id}
                      type="button"
                      disabled={isFull || isSubmitting}
                      onClick={() => setSelectedSlot(slot.id)}
                      className={`group p-5 rounded-2xl border-2 text-left transition-all relative overflow-hidden ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 shadow-md ring-1 ring-blue-600'
                          : isFull 
                            ? 'border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed'
                            : 'border-slate-100 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex flex-col h-full justify-between">
                        <span className={`text-base font-bold leading-tight ${isSelected ? 'text-blue-700' : 'text-slate-800'}`}>
                          {slot.time}
                        </span>
                        
                        <div className="mt-4 flex items-center justify-between">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                            isFull ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {isFull ? 'FULL' : `${remaining} spots left`}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium uppercase">
                            Quota: {slot.quota}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Admin Warning */}
            <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-4">
              <div className="bg-amber-100 p-2 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <p className="text-sm text-amber-900 font-bold">Important Notice</p>
                <p className="text-sm text-amber-800/80 mt-1">
                  If you would need to change your slot, you need to contact admin, so choose slot carefully. No edits are allowed after submission.
                </p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="animate-shake p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-semibold text-center">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!selectedSlot || !fullName || isSubmitting}
              className="w-full py-5 bg-slate-900 text-white rounded-[1.25rem] font-black text-xl hover:bg-black active:scale-[0.99] transition-all disabled:bg-slate-200 disabled:text-slate-400 disabled:scale-100 flex items-center justify-center gap-3 shadow-xl shadow-slate-200"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin text-white/50" />
                  Securing Slot...
                </>
              ) : (
                "Submit Selection"
              )}
            </button>
          </form>
        )}
      </div>
      
      <p className="text-center text-slate-400 mt-8 text-sm font-medium">
        Authenticated via Google Sheets Secure API
      </p>
    </div>
  );
}