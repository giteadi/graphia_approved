import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Calendar, Filter, ChevronDown, User, Mail, DollarSign, Clock, X, Loader2, LogOut, Shield, Phone, Check, Trash2, CheckSquare, Square } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { getUser, clearSession } from '../services/authService';

interface Payment {
  id: string;
  userName: string;
  userEmail: string;
  userMobile?: string;
  amount: number;
  currency: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  paymentMethod: string;
  description?: string;
}

interface HighProbabilityUser {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  userMobile?: string;
  studentName: string;
  studentAge: string;
  contactInfo: string;
  grade: string;
  probability: string;
  isHighProbability: boolean;
  reportDate: string;
  paymentStatus: string;
}

export default function AdminPanel() {
  const user = getUser();
  const navigate = useNavigate();
  
  // Check if user is admin - redirect if not
  if (!user || user.email !== 'admin@graphiacheck.in') {
    return <Navigate to="/auth" replace />;
  }

  const [payments, setPayments] = useState<Payment[]>([]);
  const [highProbabilityUsers, setHighProbabilityUsers] = useState<HighProbabilityUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingHighProb, setLoadingHighProb] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'payments' | 'high-probability'>('payments');
  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set());
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [selectAllPayments, setSelectAllPayments] = useState(false);
  const [selectAllUsers, setSelectAllUsers] = useState(false);

  const handleLogout = useCallback(() => {
    clearSession();
    navigate('/auth');
  }, [navigate]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedDate, setSelectedDate] = useState<{ day: string; month: string; year: string }>({
    day: '',
    month: '',
    year: ''
  });
  const [showCalendar, setShowCalendar] = useState(false);

  // Fetch payments from server
  useEffect(() => {
    if (activeTab === 'payments') {
      fetchPayments();
    }
  }, [debouncedSearch, selectedDate, activeTab]);

  // Reset select all when payments change
  useEffect(() => {
    setSelectedPayments(new Set());
    setSelectAllPayments(false);
  }, [payments]);

  // Fetch high probability users
  useEffect(() => {
    if (activeTab === 'high-probability') {
      fetchHighProbabilityUsers();
    }
  }, [activeTab]);

  // Reset select all when high probability users change
  useEffect(() => {
    setSelectedUsers(new Set());
    setSelectAllUsers(false);
  }, [highProbabilityUsers]);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (selectedDate.day) params.append('day', selectedDate.day);
      if (selectedDate.month) params.append('month', selectedDate.month);
      if (selectedDate.year) params.append('year', selectedDate.year);

      const response = await fetch(`/api/admin/payments?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch payments');
      }
      
      const data = await response.json();
      setPayments(data);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError('Failed to load payments. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedDate]);

  const fetchHighProbabilityUsers = useCallback(async () => {
    setLoadingHighProb(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/high-probability-users');

      if (!response.ok) {
        throw new Error('Failed to fetch high probability users');
      }

      const data = await response.json();
      setHighProbabilityUsers(data);
    } catch (err) {
      console.error('Error fetching high probability users:', err);
      setError('Failed to load high probability users. Please try again.');
    } finally {
      setLoadingHighProb(false);
    }
  }, []);

  // Selection handlers
  const handlePaymentSelect = useCallback((paymentId: string) => {
    setSelectedPayments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(paymentId)) {
        newSet.delete(paymentId);
        setSelectAllPayments(false);
      } else {
        newSet.add(paymentId);
        // Check if all payments are now selected
        if (newSet.size === payments.length) {
          setSelectAllPayments(true);
        }
      }
      return newSet;
    });
  }, [payments.length]);

  const handleUserSelect = useCallback((userId: number) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
        setSelectAllUsers(false);
      } else {
        newSet.add(userId);
        // Check if all users are now selected
        if (newSet.size === highProbabilityUsers.length) {
          setSelectAllUsers(true);
        }
      }
      return newSet;
    });
  }, [highProbabilityUsers.length]);

  const handleSelectAllPayments = useCallback(() => {
    if (selectAllPayments) {
      setSelectedPayments(new Set());
    } else {
      setSelectedPayments(new Set(payments.map(p => p.id)));
    }
    setSelectAllPayments(!selectAllPayments);
  }, [selectAllPayments, payments]);

  const handleSelectAllUsers = useCallback(() => {
    if (selectAllUsers) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(highProbabilityUsers.map(u => u.id)));
    }
    setSelectAllUsers(!selectAllUsers);
  }, [selectAllUsers, highProbabilityUsers]);

  // Delete handlers
  const handleDeletePayments = useCallback(async () => {
    if (selectedPayments.size === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedPayments.size} payment(s)?`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/payments/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedPayments) })
      });

      if (!response.ok) {
        throw new Error('Failed to delete payments');
      }

      setSelectedPayments(new Set());
      setSelectAllPayments(false);
      fetchPayments();
    } catch (err) {
      console.error('Error deleting payments:', err);
      setError('Failed to delete payments. Please try again.');
    }
  }, [selectedPayments, fetchPayments]);

  const handleDeleteUsers = useCallback(async () => {
    if (selectedUsers.size === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedUsers.size} user report(s)?`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/high-probability-users/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedUsers) })
      });

      if (!response.ok) {
        throw new Error('Failed to delete users');
      }

      setSelectedUsers(new Set());
      setSelectAllUsers(false);
      fetchHighProbabilityUsers();
    } catch (err) {
      console.error('Error deleting users:', err);
      setError('Failed to delete users. Please try again.');
    }
  }, [selectedUsers, fetchHighProbabilityUsers]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Get unique user names for suggestions
  const userNames = useMemo(() => {
    return Array.from(new Set(payments.map(p => p.userName)));
  }, [payments]);

  // Get suggestions based on search term
  const suggestions = useMemo(() => {
    if (!searchTerm) return [];
    return userNames.filter(name => 
      name.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 5);
  }, [searchTerm, userNames]);

  const handleSuggestionClick = useCallback((name: string) => {
    setSearchTerm(name);
    setShowSuggestions(false);
  }, []);

  const clearDateFilter = useCallback(() => {
    setSelectedDate({ day: '', month: '', year: '' });
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const formatDate = useCallback((dateString: string) => {
    if (!dateString || dateString === 'N/A') return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  }, []);

  const formatTime = useCallback((dateString: string) => {
    if (!dateString || dateString === 'N/A') return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return 'N/A';
    }
  }, []);

  const getProbabilityColor = useCallback((probability: string) => {
    const prob = probability?.toLowerCase() || '';
    if (prob.includes('very') || prob.includes('important')) {
      return 'bg-red-100 text-red-800';
    } else if (prob.includes('high')) {
      return 'bg-orange-100 text-orange-800';
    } else if (prob.includes('moderate')) {
      return 'bg-yellow-100 text-yellow-800';
    } else if (prob.includes('low')) {
      return 'bg-green-100 text-green-800';
    }
    return 'bg-gray-100 text-gray-800';
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
                <p className="text-sm text-gray-500">Manage payments and user data</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="p-6">
        <div className="max-w-7xl mx-auto">

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search with suggestions */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Users
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, email, or ID..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              
              {/* Suggestions dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {suggestions.map((name, index) => (
                    <div
                      key={index}
                      onClick={() => handleSuggestionClick(name)}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                    >
                      <User className="w-4 h-4 text-gray-400" />
                      <span>{name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Filter
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <button
                  onClick={() => setShowCalendar(!showCalendar)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left flex items-center justify-between"
                >
                  <span>
                    {selectedDate.day || selectedDate.month || selectedDate.year
                      ? `${selectedDate.day ? selectedDate.day + '/' : ''}${selectedDate.month ? selectedDate.month + '/' : ''}${selectedDate.year || ''}`
                      : 'Select date'}
                  </span>
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                </button>
                {(selectedDate.day || selectedDate.month || selectedDate.year) && (
                  <button
                    onClick={clearDateFilter}
                    className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Calendar Dropdown */}
              {showCalendar && (
                <div className="absolute z-20 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-64">
                  <div className="grid grid-cols-3 gap-2">
                    {/* Day */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Day</label>
                      <select
                        value={selectedDate.day}
                        onChange={(e) => setSelectedDate({ ...selectedDate, day: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="">Day</option>
                        {Array.from({ length: 31 }, (_, i) => (
                          <option key={i} value={String(i + 1)}>{i + 1}</option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Month */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Month</label>
                      <select
                        value={selectedDate.month}
                        onChange={(e) => setSelectedDate({ ...selectedDate, month: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="">Month</option>
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i} value={String(i + 1)}>{i + 1}</option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Year */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
                      <select
                        value={selectedDate.year}
                        onChange={(e) => setSelectedDate({ ...selectedDate, year: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="">Year</option>
                        {Array.from({ length: 5 }, (_, i) => (
                          <option key={i} value={String(2024 - i)}>{2024 - i}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="mb-4 text-sm text-gray-600">
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading payments...</span>
            </div>
          ) : error ? (
            <div className="text-gray-600">{error}</div>
          ) : (
            `Showing ${payments.length} payments`
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'payments'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Payments
          </button>
          <button
            onClick={() => setActiveTab('high-probability')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'high-probability'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            High Probability Reports
          </button>
        </div>

        {/* Payment Table - Show only when payments tab is active */}
        {activeTab === 'payments' && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Bulk actions bar */}
          {selectedPayments.size > 0 && (
            <div className="bg-blue-50 border-b border-blue-200 px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-blue-900">
                  {selectedPayments.size} payment(s) selected
                </span>
              </div>
              <button
                onClick={handleDeletePayments}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Delete Selected
              </button>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={handleSelectAllPayments}
                      className="flex items-center gap-2 hover:text-gray-700"
                    >
                      {selectAllPayments ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400" />
                      )}
                      <span>Select All</span>
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mobile
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handlePaymentSelect(payment.id)}
                        className="flex items-center justify-center"
                      >
                        {selectedPayments.has(payment.id) ? (
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{payment.userName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">{payment.userEmail}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">{payment.userMobile || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-sm font-medium text-gray-900">
                          {payment.amount.toFixed(2)} {payment.currency}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">{formatDate(payment.date)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">{formatTime(payment.date)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {payment.paymentMethod}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {payment.description || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {payments.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-500">No payments available</p>
            </div>
          )}
        </div>
        )}

        {/* High Probability Users Table - Show only when high-probability tab is active */}
        {activeTab === 'high-probability' && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">High Probability Reports - Follow-up Required</h2>
              <p className="text-sm text-gray-600 mt-1">Users with HIGH dysgraphia probability who need clinical follow-up</p>
            </div>
            
            {/* Bulk actions bar */}
            {selectedUsers.size > 0 && (
              <div className="bg-red-50 border-b border-red-200 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-red-900">
                    {selectedUsers.size} report(s) selected
                  </span>
                </div>
                <button
                  onClick={handleDeleteUsers}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Selected
                </button>
              </div>
            )}
            
            {loadingHighProb ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
                <span className="text-gray-600">Loading high probability reports...</span>
              </div>
            ) : highProbabilityUsers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No high probability reports found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-red-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button
                          onClick={handleSelectAllUsers}
                          className="flex items-center gap-2 hover:text-gray-700"
                        >
                          {selectAllUsers ? (
                            <CheckSquare className="w-4 h-4 text-red-600" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-400" />
                          )}
                          <span>Select All</span>
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Report ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Age
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Grade
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Probability
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Report Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {highProbabilityUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-red-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleUserSelect(user.id)}
                            className="flex items-center justify-center"
                          >
                            {selectedUsers.has(user.id) ? (
                              <CheckSquare className="w-5 h-5 text-red-600" />
                            ) : (
                              <Square className="w-5 h-5 text-gray-400" />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{user.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-blue-600" />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{user.userName}</div>
                              <div className="text-xs text-gray-500">{user.userEmail}</div>
                              {user.userMobile && (
                                <div className="text-xs text-gray-500 flex items-center">
                                  <Phone className="h-3 w-3 mr-1" />
                                  {user.userMobile}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-red-600" />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{user.studentName || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.studentAge || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.grade || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getProbabilityColor(user.probability)}`}>
                            {user.probability}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.contactInfo || user.userEmail}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(user.reportDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.paymentStatus)}`}>
                            {user.paymentStatus || 'N/A'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
