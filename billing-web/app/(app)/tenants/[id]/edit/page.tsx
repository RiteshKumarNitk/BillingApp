"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { updateTenant } from '@/lib/actions/tenants';
import { ArrowLeft, Building2, User, CreditCard, Globe, Clock, IndianRupee, Briefcase } from 'lucide-react';
import Link from 'next/link';
import ImageUpload from '../../add/ImageUpload';

export default function EditTenantPage() {
  const router = useRouter();
  const params = useParams();
  const tenantId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    password: '',
    subscriptionPlan: 'FREE',
    address: '',
    gstin: '',
    logoUrl: '',
    website: '',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    aadharCardUrl: '',
    profilePictureUrl: '',
    jobTitle: ''
  });

  useEffect(() => {
    // Fetch tenant details
    const fetchTenant = async () => {
      try {
        const response = await fetch(`/api/tenants/${tenantId}`);
        if (!response.ok) throw new Error('Failed to fetch tenant data');
        const data = await response.json();
        
        setFormData({
          name: data.name || '',
          contactPerson: data.contactPerson || '',
          email: data.email || '',
          phone: data.phone || '',
          password: '',
          subscriptionPlan: data.subscriptionPlan || 'FREE',
          address: data.address || '',
          gstin: data.gstin || '',
          logoUrl: data.logoUrl || '',
          website: data.website || '',
          currency: data.currency || 'INR',
          timezone: data.timezone || 'Asia/Kolkata',
          aadharCardUrl: data.aadharCardUrl || '',
          profilePictureUrl: data.adminUser?.profilePictureUrl || '',
          jobTitle: data.adminUser?.jobTitle || ''
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setFetching(false);
      }
    };
    
    fetchTenant();
  }, [tenantId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await updateTenant(tenantId, formData);
      router.push(`/tenants/${tenantId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to update tenant');
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="flex justify-center py-20">Loading tenant details...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-6 flex items-center gap-4">
        <Link 
          href={`/tenants/${tenantId}`} 
          className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Tenant</h1>
          <p className="text-sm text-gray-500 mt-1">Update business details and subscription.</p>
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
                defaultImage={formData.aadharCardUrl}
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
                  defaultImage={formData.logoUrl}
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
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN / Tax ID</label>
                <input
                  type="text"
                  name="gstin"
                  value={formData.gstin}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all uppercase text-gray-900"
                />
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

          {/* Contact Details Section */}
          <div className="p-8 bg-gray-50/50">
            <div className="flex items-center gap-2 mb-6 text-indigo-600">
              <User className="w-5 h-5" />
              <h2 className="text-lg font-semibold text-gray-900">Primary Contact</h2>
            </div>

            <div className="col-span-1 md:col-span-2 flex gap-6 items-center mb-6 border border-gray-100 p-4 rounded-xl bg-white shadow-sm">
              <ImageUpload 
                label="Profile Picture" 
                onUploadSuccess={(url) => setFormData(prev => ({...prev, profilePictureUrl: url}))} 
                defaultImage={formData.profilePictureUrl}
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">Admin Profile Picture</p>
                <p className="text-xs text-gray-500 mt-1">Upload a professional photo for the primary administrator.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                <input
                  type="text"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all bg-white text-gray-900"
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
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all bg-white text-gray-900"
                />
              </div>

              <div className="md:col-span-2 pt-4 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-1">Reset Admin Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all bg-white text-gray-900"
                  placeholder="Leave blank to keep current password"
                />
                <p className="mt-1 text-xs text-gray-500">Only fill this out if you need to reset the tenant administrator's password.</p>
              </div>
            </div>
          </div>

          {/* Subscription Section */}
          <div className="p-8">
            <div className="flex items-center gap-2 mb-6 text-indigo-600">
              <CreditCard className="w-5 h-5" />
              <h2 className="text-lg font-semibold text-gray-900">Subscription & Billing</h2>
            </div>
            
            <div className="max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan Tier *</label>
              <select
                name="subscriptionPlan"
                required
                value={formData.subscriptionPlan}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all bg-white text-gray-900"
              >
                <option value="FREE">Free Tier (Limited features)</option>
                <option value="BASIC">Basic Plan (Standard business)</option>
                <option value="PREMIUM">Premium Plan (Unlimited access)</option>
                <option value="ENTERPRISE">Enterprise Plan (Custom solutions)</option>
              </select>
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
                href={`/tenants/${tenantId}`}
                className="px-6 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
