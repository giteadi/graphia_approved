import React, { useState, useEffect, useMemo } from 'react';
import { Search, Calendar, Filter, ChevronDown, User, Mail, DollarSign, Clock, X, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getUser } from '../services/authService';

interface Payment {
  id: string;
  userName: string;
  userEmail: string;
  amount: number;
  currency: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  paymentMethod: string;
  description?: string;
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // Check if user is admin
  useEffect(() => {
    const user = getUser();
    if (!user || user.email !== 'admin@graphiacheck.in') {
      navigate('/auth');
      return;
    }
    setAuthChecking(false);
  }, [navigate]);

  if (authChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }
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
    fetchPayments();
  }, [debouncedSearch, selectedDate]);

  const fetchPayments = async () => {
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
  };

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

  const handleSuggestionClick = (name: string) => {
    setSearchTerm(name);
    setShowSuggestions(false);
  };

  const clearDateFilter = () => {
    setSelectedDate({ day: '', month: '', year: '' });
  };

  const getStatusColor = (status: string) => {
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
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
          <p className="text-gray-600">Manage payments and user data</p>
        </div>

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

        {/* Payment Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {payment.id}
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
                        <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-sm font-medium text-gray-900">
                          {payment.amount.toFixed(2)} {payment.currency}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">{payment.date}</span>
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
      </div>
    </div>
  );
}
