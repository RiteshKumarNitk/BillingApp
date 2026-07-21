"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createTenant } from '@/lib/actions/tenants';
import { validateCouponByPlanName } from '@/lib/actions/subscription';
import { ArrowLeft, Building2, User, Key, CreditCard, Globe, Clock, Briefcase, IndianRupee, Tag, CheckCircle } from 'lucide-react';
import { toUrlSlug } from '@/lib/website/slug';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toast';
import ImageUpload from '@/components/ImageUpload';

export default function AddTenantPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponResult, setCouponResult] = useState<{ discountAmount: number, finalAmount: number, originalAmount: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    password: '',
    subscriptionPlan: 'Starter',
    address: '',
    gstin: '',
    logoUrl: '',
    website: '',
    websiteSlug: '',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    profilePictureUrl: '',
    jobTitle: '',
    aadharCardUrl: '',
    discountCode: '',
    businessType: 'CAFE'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'name' && !prev.websiteSlug) {
        updated.websiteSlug = toUrlSlug(value);
      }
      return updated;
    });
    if (name === 'subscriptionPlan' || name === 'discountCode') {
      setCouponResult(null); // reset coupon result if plan or code changes
    }
  };

  const handleApplyCoupon = async () => {
    if (!formData.discountCode || !formData.discountCode.trim()) {
      addToast('error', 'Please enter a discount code first');
      return;
    }
    setValidatingCoupon(true);
    try {
      const res = await validateCouponByPlanName(formData.discountCode, formData.subscriptionPlan);
      setCouponResult(res);
      addToast('success', 'Coupon applied successfully!');
    } catch (err: any) {
      addToast('error', err.message || 'Invalid coupon');
      setCouponResult(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await createTenant(formData);
      addToast('success', `Tenant ${formData.name} created successfully!`);
      setTimeout(() => {
        router.push('/tenants');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to create tenant');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-6 flex items-center gap-4">
        <Link 
          href="/tenants" 
          className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Tenant</h1>
          <p className="text-sm text-gray-500 mt-1">Onboard a new business to the platform.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <form onSubmit={handleSubmit} className="divide-y divide-gray-100">
          
          {/* KYC Documents Section */}
          <div className="p-8 bg-amber-50/30">
            <div className="flex items-center gap-2 mb-6 text-amber-600">
              <User className="w-5 h-5" />
              <h2 className="text-lg font-semibold text-gray-900">KYC Documents</h2>
            </div>
            
            <div className="col-span-1 md:col-span-2 flex gap-6 items-center border border-gray-100 p-4 rounded-xl bg-white shadow-sm">
              <ImageUpload 
                label="Aadhar Card" 
                onUploadSuccess={(url) => setFormData(prev => ({...prev, aadharCardUrl: url}))} 
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">Aadhar Card Photo (Optional)</p>
                <p className="text-xs text-gray-500 mt-1">Upload a clear photo of the business owner's Aadhar Card for verification purposes.</p>
              </div>
            </div>
          </div>

          {/* Business Details Section */}
          <div className="p-8">
            <div className="flex items-center gap-2 mb-6 text-indigo-600">
              <Building2 className="w-5 h-5" />
              <h2 className="text-lg font-semibold text-gray-900">Business Details</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="col-span-1 md:col-span-2 flex gap-6 items-center border border-gray-100 p-4 rounded-xl bg-gray-50/50">
                <ImageUpload 
                  label="Business Logo" 
                  onUploadSuccess={(url) => setFormData(prev => ({...prev, logoUrl: url}))} 
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">Upload a Logo</p>
                  <p className="text-xs text-gray-500 mt-1">This will be used on receipts, digital menus, and invoices. Max size 5MB.</p>
                </div>
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-gray-900"
                  placeholder="e.g. Acme Supermarket"
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  name="address"
                  rows={2}
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-gray-900"
                  placeholder="123 Market St, City, State, ZIP"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
                <select
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-gray-900 bg-white"
                >
                  <option value="CAFE">Cafe</option>
                  <option value="LAUNDRY">Laundry</option>
                  <option value="SALON">Salon</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN / Tax ID</label>
                <input
                  type="text"
                  name="gstin"
                  value={formData.gstin}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all uppercase text-gray-900"
                  placeholder="29ABCDE1234F1Z5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website Slug
                  <span className="text-gray-400 font-normal ml-1">(unique URL name)</span>
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="websiteSlug"
                    value={formData.websiteSlug}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 pl-9 pr-4 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-gray-900 font-mono text-sm"
                    placeholder="kunal-sons"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Public URL: /site/{formData.websiteSlug || '(slug)'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 pl-9 pr-4 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-gray-900"
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <div className="relative">
                  <IndianRupee className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 pl-9 pr-4 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-gray-900 bg-white"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    name="timezone"
                    value={formData.timezone}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 pl-9 pr-4 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-gray-900 bg-white"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                    <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
                  </select>
                </div>
              </div>

            </div>
          </div>

          {/* Account Settings Section */}
          <div className="p-8 bg-gray-50/50">
            <div className="flex items-center gap-2 mb-6 text-indigo-600">
              <User className="w-5 h-5" />
              <h2 className="text-lg font-semibold text-gray-900">Admin Account</h2>
            </div>

            <div className="col-span-1 md:col-span-2 flex gap-6 items-center mb-6 border border-gray-100 p-4 rounded-xl bg-white shadow-sm">
              <ImageUpload 
                label="Profile Picture" 
                onUploadSuccess={(url) => setFormData(prev => ({...prev, profilePictureUrl: url}))} 
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">Admin Profile Picture</p>
                <p className="text-xs text-gray-500 mt-1">Upload a professional photo for the primary administrator.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person *</label>
                <input
                  type="text"
                  name="contactPerson"
                  required
                  value={formData.contactPerson}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all bg-white text-gray-900"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Title / Role</label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="jobTitle"
                    value={formData.jobTitle}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 pl-9 pr-4 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all bg-white text-gray-900"
                    placeholder="e.g. Store Manager"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all bg-white text-gray-900"
                  placeholder="+91 9876543210"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email (Login ID) *</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all bg-white text-gray-900"
                  placeholder="admin@acme.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Initial Password *</label>
                <div className="relative">
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all bg-white pr-10 text-gray-900"
                    placeholder="Secure password"
                  />
                  <Key className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Section */}
          <div className="p-8">
            <div className="flex items-center gap-2 mb-6 text-indigo-600">
              <CreditCard className="w-5 h-5" />
              <h2 className="text-lg font-semibold text-gray-900">Subscription & Billing</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan Tier *</label>
                <select
                  name="subscriptionPlan"
                  required
                  value={formData.subscriptionPlan}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all bg-white text-gray-900"
                >
                  <option value="Starter">Starter (₹299/mo)</option>
                  <option value="Professional">Professional (₹699/mo)</option>
                  <option value="Enterprise">Enterprise (₹1,999/mo)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="discountCode"
                    value={formData.discountCode || ''}
                    onChange={handleChange}
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-gray-900 uppercase"
                    placeholder="e.g. SAVE20"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={validatingCoupon || !formData.discountCode}
                    className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold rounded-lg text-sm transition-colors disabled:opacity-50"
                  >
                    {validatingCoupon ? 'Checking...' : 'Apply'}
                  </button>
                </div>
                {couponResult && (
                  <div className="mt-3 p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-emerald-800">Discount Applied Successfully</p>
                      <p className="text-xs text-emerald-600 mt-1">
                        Original: ₹{couponResult.originalAmount} | Discount: -₹{couponResult.discountAmount}
                      </p>
                      <p className="text-sm font-bold text-emerald-900 mt-1">
                        Final Amount: ₹{couponResult.finalAmount}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="p-6 bg-gray-50 flex items-center justify-between">
            {error ? (
              <p className="text-sm font-medium text-rose-600">{error}</p>
            ) : (
              <div></div>
            )}
            
            <div className="flex items-center gap-3">
              <Link 
                href="/tenants"
                className="px-6 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating Tenant...' : 'Create Tenant'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
