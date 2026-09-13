import React, { useState } from 'react';
import {
  Bike,
  Shield,
  Clock,
  Banknote,
  CheckCircle2,
  ChevronRight,
  MapPin,
  FileText,
  CreditCard,
  Building,
  User,
  Phone,
  Mail,
  AlertCircle,
  HelpCircle,
  Package,
  Calendar,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { DarkStore, DeliveryPartnerApplication } from '../types.js';

interface DeliveryPartnerSectionProps {
  darkStores: DarkStore[];
  onBackToStore?: () => void;
}

export const DeliveryPartnerSection: React.FC<DeliveryPartnerSectionProps> = ({
  darkStores,
  onBackToStore
}) => {
  // Earnings Calculator State
  const [deliveriesPerDay, setDeliveriesPerDay] = useState<number>(25);
  const [daysPerWeek, setDaysPerWeek] = useState<number>(6);

  // Form Step State
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city] = useState('Bengaluru');
  const [preferredHubId, setPreferredHubId] = useState<string>(darkStores[0]?.id || 'blr-krm-04');
  const [vehicleType, setVehicleType] = useState<'ev_scooter' | 'motorcycle' | 'bicycle' | 'none'>('ev_scooter');
  const [drivingLicenseNumber, setDrivingLicenseNumber] = useState('');
  const [panCard, setPanCard] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [preferredShift, setPreferredShift] = useState<'morning' | 'evening' | 'night' | 'flexible'>('evening');
  const [hasSmartphone, setHasSmartphone] = useState(true);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedApplication, setSubmittedApplication] = useState<{
    application: DeliveryPartnerApplication;
    onboardingDetails: {
      hubName: string;
      hubAddress: string;
      reportingSlot: string;
      itemsToCarry: string[];
      starterKit: string[];
      helplinePhone: string;
    };
  } | null>(null);

  // Calculate earnings
  const baseRatePerOrder = 45;
  const peakIncentivePerOrder = 15;
  const avgOrderEarnings = baseRatePerOrder + peakIncentivePerOrder;
  const weeklyEarnings = deliveriesPerDay * daysPerWeek * avgOrderEarnings;
  const monthlyEarnings = Math.round(weeklyEarnings * 4.3);

  // Validate step 1
  const isStep1Valid =
    fullName.trim().length >= 2 &&
    phone.replace(/\D/g, '').length === 10 &&
    preferredHubId.length > 0;

  // Validate step 2
  const isStep2Valid =
    (vehicleType === 'bicycle' || vehicleType === 'none') ||
    drivingLicenseNumber.trim().length >= 5;

  // Validate step 3
  const isStep3Valid =
    panCard.trim().length === 10 &&
    aadhaarNumber.replace(/\D/g, '').length === 12 &&
    bankAccountNumber.trim().length >= 6 &&
    ifscCode.trim().length >= 4;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isStep1Valid || !isStep2Valid || !isStep3Valid) {
      setErrorMessage('Please fill in all required fields accurately.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/delivery-partners/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          phone,
          email,
          city,
          preferredHubId,
          vehicleType,
          drivingLicenseNumber: vehicleType !== 'bicycle' && vehicleType !== 'none' ? drivingLicenseNumber : undefined,
          panCard,
          aadhaarNumber,
          bankAccountNumber,
          ifscCode,
          preferredShift,
          hasSmartphone
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed. Please try again.');
      }

      setSubmittedApplication(data);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'An error occurred during submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Back to Shopping Header */}
      {onBackToStore && (
        <div className="flex items-center justify-between">
          <button
            onClick={onBackToStore}
            className="flex items-center gap-2 text-xs font-bold text-stone-700 hover:text-stone-900 bg-white border border-stone-200 px-3 py-1.5 rounded-lg shadow-sm transition-all hover:bg-stone-50 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Store</span>
          </button>
          <span className="text-xs text-stone-500 font-medium">
            SwiftCart Delivery Partner Fleet
          </span>
        </div>
      )}

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-950 via-stone-900 to-amber-950 text-white p-6 sm:p-10 shadow-xl border border-stone-800">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Immediate Onboarding • Instant Verification</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Ride with SwiftCart & Earn up to <span className="text-amber-400">₹35,000 / month</span>
          </h1>
          <p className="text-sm sm:text-base text-stone-300 leading-relaxed">
            Deliver groceries from local dark store hubs within an 8-minute radius. Enjoy weekly payouts, flexible shifts, free starter gear, and medical insurance.
          </p>
        </div>

        {/* 4 Value Pillars */}
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-400 text-stone-950 font-black">
              <Banknote className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Weekly Payouts</p>
              <p className="text-[11px] text-stone-400">Direct deposit every Tuesday</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-400 text-stone-950 font-black">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Flexible Shifts</p>
              <p className="text-[11px] text-stone-400">4hr, 8hr or weekend slots</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-blue-400 text-stone-950 font-black">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">₹5 Lakh Insurance</p>
              <p className="text-[11px] text-stone-400">Medical & accident cover</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-purple-400 text-stone-950 font-black">
              <Bike className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">EV Scooter Support</p>
              <p className="text-[11px] text-stone-400">Battery swap discounts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Earnings Calculator + Registration Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Interactive Earnings Calculator (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-stone-900 text-base">Earnings Calculator</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                  Live Estimate
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Estimate your weekly and monthly earnings based on hours and completed orders.
              </p>
            </div>

            {/* Slider 1: Deliveries per Day */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-stone-700">Orders per day</span>
                <span className="font-bold font-mono text-stone-900 text-sm">{deliveriesPerDay} deliveries</span>
              </div>
              <input
                type="range"
                min="10"
                max="40"
                step="1"
                value={deliveriesPerDay}
                onChange={(e) => setDeliveriesPerDay(parseInt(e.target.value))}
                className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[10px] text-stone-500">
                <span>10 orders (Part-time)</span>
                <span>25 orders (Average)</span>
                <span>40 orders (Full-time peak)</span>
              </div>
            </div>

            {/* Slider 2: Working Days per Week */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-stone-700">Working days per week</span>
                <span className="font-bold font-mono text-stone-900 text-sm">{daysPerWeek} days</span>
              </div>
              <input
                type="range"
                min="4"
                max="7"
                step="1"
                value={daysPerWeek}
                onChange={(e) => setDaysPerWeek(parseInt(e.target.value))}
                className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[10px] text-stone-500">
                <span>4 days</span>
                <span>5 days</span>
                <span>6 days</span>
                <span>7 days</span>
              </div>
            </div>

            {/* Earnings Calculation Output Card */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-amber-900 font-semibold uppercase tracking-wider">Estimated Monthly</span>
                  <p className="text-2xl sm:text-3xl font-black text-amber-950 font-mono">
                    ₹{monthlyEarnings.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-amber-800 font-semibold">Weekly Payout</span>
                  <p className="text-sm font-bold text-amber-900 font-mono">
                    ₹{weeklyEarnings.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-amber-200/80 space-y-1.5 text-xs text-amber-950">
                <div className="flex justify-between">
                  <span className="text-stone-600">Base Pay per Order:</span>
                  <span className="font-mono font-bold">₹{baseRatePerOrder}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Peak Rush Incentive:</span>
                  <span className="font-mono font-bold text-emerald-700">+₹{peakIncentivePerOrder} / order</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Total Monthly Deliveries:</span>
                  <span className="font-mono font-bold">{deliveriesPerDay * daysPerWeek * 4} orders</span>
                </div>
              </div>
            </div>

            {/* Required Documents Checklist */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2.5">
              <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-600" />
                <span>Documents Needed to Join</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-stone-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Aadhaar Card (Original or DigiLocker)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>PAN Card for tax and weekly settlements</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Driving License (for Motorcycle / EV Scooter)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Active Bank Account & IFSC Code for payouts</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column: Application Form or Success State (7 cols) */}
        <div className="lg:col-span-7">
          {submittedApplication ? (
            /* Success State Card */
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-200 shadow-md space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                    Application Pre-Approved
                  </span>
                  <h3 className="text-xl font-extrabold text-stone-900 mt-0.5">
                    Welcome to SwiftCart, {submittedApplication.application.fullName}!
                  </h3>
                </div>
              </div>

              {/* Reference Banner */}
              <div className="p-4 rounded-2xl bg-stone-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-stone-400">Rider Application Reference</p>
                  <p className="text-base sm:text-lg font-mono font-bold text-amber-400">
                    {submittedApplication.application.id}
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="text-xs text-stone-400">Assigned Dark Store Hub</p>
                  <p className="text-sm font-semibold text-white">
                    {submittedApplication.onboardingDetails.hubName}
                  </p>
                </div>
              </div>

              {/* Next Steps for Rider */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                  Next Steps to Start Delivering:
                </h4>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                    <div className="w-7 h-7 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center font-black text-xs">
                      1
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-900">Visit Assigned Dark Store Hub</p>
                      <p className="text-xs text-stone-600 mt-0.5">
                        {submittedApplication.onboardingDetails.hubAddress}
                      </p>
                      <p className="text-[11px] font-semibold text-amber-700 mt-1">
                        Reporting Slot: {submittedApplication.onboardingDetails.reportingSlot}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                    <div className="w-7 h-7 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center font-black text-xs">
                      2
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-900">Documents to Carry</p>
                      <ul className="text-xs text-stone-600 list-disc list-inside mt-0.5">
                        {submittedApplication.onboardingDetails.itemsToCarry.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                    <div className="w-7 h-7 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center font-black text-xs">
                      3
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-900">Collect Your Starter Kit</p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {submittedApplication.onboardingDetails.starterKit.map((item, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-white border border-stone-200 text-[11px] text-stone-700 font-medium"
                          >
                            ✓ {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hub Manager Contact & Reset */}
              <div className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-stone-600 text-center sm:text-left">
                  Questions? Call Hub Support: <strong className="text-stone-900">{submittedApplication.onboardingDetails.helplinePhone}</strong>
                </div>
                {onBackToStore && (
                  <button
                    onClick={onBackToStore}
                    className="w-full sm:w-auto px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Return to Store
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Multi-Step Application Form */
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-bold text-stone-900">Delivery Partner Application</h3>
                <p className="text-xs text-stone-500 mt-1">
                  Fill in your required personal, vehicle, and bank details to complete onboarding.
                </p>
              </div>

              {/* Step Navigation Pills */}
              <div className="grid grid-cols-3 gap-2 border-b border-stone-200 pb-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    step === 1
                      ? 'bg-amber-100 text-amber-950 border border-amber-300'
                      : isStep1Valid
                      ? 'bg-emerald-50 text-emerald-800'
                      : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-[10px] font-bold">1</span>
                  <span>Personal</span>
                </button>

                <button
                  type="button"
                  onClick={() => isStep1Valid && setStep(2)}
                  disabled={!isStep1Valid}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    !isStep1Valid
                      ? 'opacity-50 cursor-not-allowed bg-stone-100 text-stone-400'
                      : step === 2
                      ? 'bg-amber-100 text-amber-950 border border-amber-300 cursor-pointer'
                      : isStep2Valid
                      ? 'bg-emerald-50 text-emerald-800 cursor-pointer'
                      : 'bg-stone-100 text-stone-600 cursor-pointer'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-[10px] font-bold">2</span>
                  <span>Vehicle</span>
                </button>

                <button
                  type="button"
                  onClick={() => isStep1Valid && isStep2Valid && setStep(3)}
                  disabled={!isStep1Valid || !isStep2Valid}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    !isStep1Valid || !isStep2Valid
                      ? 'opacity-50 cursor-not-allowed bg-stone-100 text-stone-400'
                      : step === 3
                      ? 'bg-amber-100 text-amber-950 border border-amber-300 cursor-pointer'
                      : 'bg-stone-100 text-stone-600 cursor-pointer'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-[10px] font-bold">3</span>
                  <span>KYC & Bank</span>
                </button>
              </div>

              {/* Error Notice */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* STEP 1: Personal & Hub Details */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Full Name (as per Aadhaar) *
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            placeholder="e.g. Ramesh Kumar"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Mobile Number *
                        </label>
                        <div className="relative">
                          <span className="text-xs font-bold text-stone-500 absolute left-3 top-1/2 -translate-y-1/2">+91</span>
                          <input
                            type="tel"
                            required
                            maxLength={10}
                            placeholder="9876543210"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                            className="w-full pl-12 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 font-mono focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Email Address (Optional)
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="email"
                            placeholder="ramesh@gmail.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Preferred Dark Store Hub *
                        </label>
                        <div className="relative">
                          <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <select
                            value={preferredHubId}
                            onChange={(e) => setPreferredHubId(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
                          >
                            {darkStores.map((ds) => (
                              <option key={ds.id} value={ds.id}>
                                {ds.name} ({ds.code})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 flex justify-end">
                      <button
                        type="button"
                        disabled={!isStep1Valid}
                        onClick={() => setStep(2)}
                        className="flex items-center gap-1.5 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        <span>Next: Vehicle Details</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: Vehicle & Driving License */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-2">
                        Select Your Delivery Vehicle Type *
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setVehicleType('ev_scooter')}
                          className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                            vehicleType === 'ev_scooter'
                              ? 'bg-amber-50 border-amber-400 text-amber-950 font-bold shadow-sm'
                              : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                          }`}
                        >
                          <span className="text-xl">🛵</span>
                          <span className="text-xs">EV Scooter</span>
                          <span className="text-[10px] text-emerald-700 font-semibold">Recommended</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setVehicleType('motorcycle')}
                          className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                            vehicleType === 'motorcycle'
                              ? 'bg-amber-50 border-amber-400 text-amber-950 font-bold shadow-sm'
                              : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                          }`}
                        >
                          <span className="text-xl">🏍️</span>
                          <span className="text-xs">Petrol Bike</span>
                          <span className="text-[10px] text-stone-500">Fast delivery</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setVehicleType('bicycle')}
                          className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                            vehicleType === 'bicycle'
                              ? 'bg-amber-50 border-amber-400 text-amber-950 font-bold shadow-sm'
                              : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                          }`}
                        >
                          <span className="text-xl">🚲</span>
                          <span className="text-xs">Bicycle</span>
                          <span className="text-[10px] text-stone-500">No DL needed</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setVehicleType('none')}
                          className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                            vehicleType === 'none'
                              ? 'bg-amber-50 border-amber-400 text-amber-950 font-bold shadow-sm'
                              : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                          }`}
                        >
                          <span className="text-xl">⚡</span>
                          <span className="text-xs">Need EV Rental</span>
                          <span className="text-[10px] text-purple-700 font-semibold">Hub rental</span>
                        </button>
                      </div>
                    </div>

                    {(vehicleType === 'motorcycle' || vehicleType === 'ev_scooter') && (
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Driving License (DL) Number *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. KA01 20210009842"
                          value={drivingLicenseNumber}
                          onChange={(e) => setDrivingLicenseNumber(e.target.value.toUpperCase())}
                          className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 font-mono uppercase focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
                        />
                        <p className="text-[11px] text-stone-500 mt-1">
                          Required by traffic regulations for motorized delivery.
                        </p>
                      </div>
                    )}

                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>I have a working 4G/5G smartphone with GPS</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={hasSmartphone}
                        onChange={(e) => setHasSmartphone(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-600 accent-amber-600 cursor-pointer"
                      />
                    </div>

                    <div className="pt-3 flex justify-between">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        disabled={!isStep2Valid}
                        onClick={() => setStep(3)}
                        className="flex items-center gap-1.5 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        <span>Next: KYC & Bank Payout</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: KYC & Bank Details */}
                {step === 3 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          PAN Card Number *
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={10}
                          placeholder="ABCDE1234F"
                          value={panCard}
                          onChange={(e) => setPanCard(e.target.value.toUpperCase())}
                          className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 font-mono uppercase focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Aadhaar Number (12 Digits) *
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={12}
                          placeholder="123456789012"
                          value={aadhaarNumber}
                          onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, ''))}
                          className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 font-mono focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Bank Account Number / UPI ID *
                        </label>
                        <div className="relative">
                          <CreditCard className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            placeholder="e.g. 501004928192 or name@oksbi"
                            value={bankAccountNumber}
                            onChange={(e) => setBankAccountNumber(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 font-mono focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Bank IFSC Code *
                        </label>
                        <div className="relative">
                          <Building className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            maxLength={11}
                            placeholder="e.g. HDFC0001234"
                            value={ifscCode}
                            onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                            className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 font-mono uppercase focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-2">
                        Preferred Shift Time *
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { id: 'morning', label: 'Morning', time: '6 AM - 2 PM' },
                          { id: 'evening', label: 'Evening', time: '2 PM - 10 PM' },
                          { id: 'night', label: 'Night Owl', time: '10 PM - 6 AM' },
                          { id: 'flexible', label: 'Weekend Only', time: 'Sat - Sun' }
                        ].map((shift) => (
                          <button
                            key={shift.id}
                            type="button"
                            onClick={() => setPreferredShift(shift.id as any)}
                            className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                              preferredShift === shift.id
                                ? 'bg-amber-50 border-amber-400 text-amber-950 font-bold'
                                : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                            }`}
                          >
                            <p className="text-xs">{shift.label}</p>
                            <p className="text-[10px] text-stone-500 font-mono mt-0.5">{shift.time}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 flex justify-between">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || !isStep3Valid}
                        className="flex items-center gap-1.5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow transition-all cursor-pointer active:scale-95"
                      >
                        {isSubmitting ? (
                          <span>Verifying & Submitting...</span>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Submit Rider Application</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
