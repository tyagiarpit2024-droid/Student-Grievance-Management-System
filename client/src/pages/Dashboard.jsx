import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import { PlusCircle, Search, Trash2, Edit, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const initialFormState = { title: '', description: '', category: 'Academic', status: 'Pending' };
  const [formData, setFormData] = useState(initialFormState);
  const [editingId, setEditingId] = useState(null);
  
  // Messages and Action States
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch grievances
  const fetchGrievances = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/grievances');
      setGrievances(res.data.data || []);
    } catch (err) {
      setError('Failed to fetch grievances. Please check your connection.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchGrievances();
    }
  }, [user]);

  // Handle Search
  const handleSearch = async (e) => {
    e.preventDefault(); // Prevent form submission refresh
    if (!searchTerm.trim()) {
      fetchGrievances();
      return;
    }
    
    try {
      setLoading(true);
      const res = await api.get(`/grievances/search?title=${searchTerm}`);
      setGrievances(res.data.data || []);
    } catch (err) {
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Reset search when input is cleared manually
  useEffect(() => {
    if (searchTerm === '') {
      fetchGrievances();
    }
  }, [searchTerm]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setActionLoading(true);
    
    try {
      if (editingId) {
        await api.put(`/grievances/${editingId}`, formData);
        setSuccess('Grievance updated successfully!');
      } else {
        // Automatically set status to pending for new submissions to override any form tampering
        await api.post('/grievances', { ...formData, status: 'Pending' });
        setSuccess('Grievance submitted successfully!');
      }
      
      setFormData(initialFormState);
      setEditingId(null);
      await fetchGrievances();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = (g) => {
    setEditingId(g._id);
    setFormData({ 
      title: g.title, 
      description: g.description, 
      category: g.category,
      status: g.status 
    });
    // Scroll to top where form is
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to permanently delete this grievance?')) {
      setActionLoading(true);
      try {
        await api.delete(`/grievances/${id}`);
        setSuccess('Grievance deleted successfully!');
        await fetchGrievances();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete grievance.');
      } finally {
        setActionLoading(false);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Notifications */}
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-center shadow-sm">
          <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-md flex items-center shadow-sm">
          <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
          <p className="text-sm text-green-700 font-medium">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ================= FORM SECTION ================= */}
        <div className="bg-white p-6 rounded-xl shadow-md h-fit border border-gray-100">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800">
            {editingId ? <Edit className="h-5 w-5 text-blue-500"/> : <PlusCircle className="h-5 w-5 text-blue-500"/>}
            {editingId ? 'Edit Grievance' : 'Submit New Grievance'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                name="title"
                required
                placeholder="e.g., WiFi issues in Hostel Block B"
                value={formData.title}
                onChange={handleInputChange}
                className="block w-full rounded-md border border-gray-300 p-2.5 focus:ring-blue-500 focus:border-blue-500 sm:text-sm outline-none transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="block w-full rounded-md border border-gray-300 p-2.5 focus:ring-blue-500 focus:border-blue-500 sm:text-sm outline-none bg-white transition-colors"
              >
                <option value="Academic">Academic</option>
                <option value="Hostel">Hostel</option>
                <option value="Transport">Transport</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Only show status dropdown if we are editing an existing grievance */}
            {editingId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border border-gray-300 p-2.5 focus:ring-blue-500 focus:border-blue-500 sm:text-sm outline-none bg-white transition-colors"
                >
                  <option value="Pending">Pending</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                required
                rows="4"
                placeholder="Please describe your issue in detail..."
                value={formData.description}
                onChange={handleInputChange}
                className="block w-full rounded-md border border-gray-300 p-2.5 focus:ring-blue-500 focus:border-blue-500 sm:text-sm outline-none transition-colors resize-none"
              ></textarea>
            </div>
            
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={actionLoading}
                className="flex-1 flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-70"
              >
                {actionLoading ? 'Saving...' : editingId ? 'Update Grievance' : 'Submit'}
              </button>
              
              {editingId && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => {
                    setEditingId(null);
                    setFormData(initialFormState);
                  }}
                  className="flex-1 flex justify-center py-2.5 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* ================= LIST SECTION ================= */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header & Search */}
          <div className="bg-white p-5 rounded-xl shadow-md flex flex-col sm:flex-row justify-between items-center gap-4 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              Your Grievances
              <span className="bg-blue-100 text-blue-800 text-xs py-1 px-2.5 rounded-full font-semibold">
                {grievances.length}
              </span>
            </h2>
            
            <form onSubmit={handleSearch} className="relative w-full sm:w-72">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
              />
              {searchTerm && (
                <button 
                  type="button" 
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  &times;
                </button>
              )}
            </form>
          </div>

          {/* List Content */}
          {loading ? (
            <div className="bg-white p-12 rounded-xl shadow-md text-center border border-gray-100">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading your grievances...</p>
            </div>
          ) : grievances.length === 0 ? (
            <div className="bg-white p-16 rounded-xl shadow-md text-center border border-gray-100">
              <div className="mx-auto h-16 w-16 text-gray-300 mb-4">
                <AlertCircle className="h-full w-full" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No grievances found</h3>
              <p className="text-gray-500 text-sm">
                {searchTerm ? 'Try adjusting your search criteria.' : 'Submit a new grievance using the form.'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
              <ul className="divide-y divide-gray-100">
                {grievances.map((g) => (
                  <li key={g._id} className="p-6 hover:bg-gray-50/80 transition-colors">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      
                      {/* Text Content */}
                      <div className="space-y-3 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-bold text-gray-900 mr-2">{g.title}</h3>
                          
                          {/* Badges */}
                          <span className={`px-2.5 py-1 text-xs font-bold rounded-md border ${
                            g.status === 'Resolved' 
                            ? 'bg-green-50 text-green-700 border-green-200' 
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {g.status}
                          </span>
                          <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                            {g.category}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{g.description}</p>
                        
                        <div className="text-xs font-medium text-gray-400 flex items-center gap-1">
                          <RefreshCw className="h-3 w-3" />
                          Last updated: {new Date(g.updatedAt || g.date).toLocaleDateString(undefined, { 
                            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                          })}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 self-end sm:self-start bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                        <button
                          onClick={() => handleEdit(g)}
                          disabled={actionLoading}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-all disabled:opacity-50"
                          title="Edit Grievance"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <div className="w-px bg-gray-300"></div>
                        <button
                          onClick={() => handleDelete(g._id)}
                          disabled={actionLoading}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-all disabled:opacity-50"
                          title="Delete Grievance"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
