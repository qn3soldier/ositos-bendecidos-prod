import React, { useState, useEffect } from 'react';
import {
  TrashIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';

const TABLES = [
  'users',
  'products',
  'community_requests',
  'donations',
  'prayers',
  'testimonials',
  'orders',
  'cart_items',
  'prayer_comments',
  'prayer_supporters',
  'investment_opportunities',
  'investment_applications'
];

interface TableRecord {
  id: string;
  [key: string]: any;
}

const DatabaseManager: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [records, setRecords] = useState<TableRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchRecords = async (table: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/.netlify/functions/admin-database?table=${table}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRecords(data.records || []);
      }
    } catch (error) {
      console.error('Error fetching records:', error);
      setRecords([]);
    }
    setLoading(false);
  };

  const deleteRecord = async (table: string, id: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/.netlify/functions/admin-database`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ table, id })
      });

      if (response.ok) {
        setRecords(records.filter(r => r.id !== id));
        setDeleteConfirm(null);
      }
    } catch (error) {
      console.error('Error deleting record:', error);
    }
  };

  useEffect(() => {
    if (selectedTable) {
      fetchRecords(selectedTable);
    }
  }, [selectedTable]);

  const filteredRecords = records.filter(record =>
    JSON.stringify(record).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, rgba(0, 0, 0, 0.95) 0%, #0a0a0a 50%, #000000 100%)`
        }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="border-b border-zinc-800/50 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="glass"
                size="sm"
                onClick={() => navigate('/admin/dashboard')}
                className="flex items-center space-x-2"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                <span>Back</span>
              </Button>
              <div>
                <h1 className="text-3xl font-black text-red-500">
                  Database Manager
                </h1>
                <p className="text-zinc-400 mt-1">Delete any record from any table</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Table Selector */}
          <Card className="border-zinc-800/50 mb-6">
            <CardHeader>
              <CardTitle className="text-xl text-yellow-400">Select Table</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {TABLES.map(table => (
                  <Button
                    key={table}
                    variant={selectedTable === table ? 'gold' : 'glass'}
                    onClick={() => setSelectedTable(table)}
                    className="capitalize"
                  >
                    {table.replace('_', ' ')}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Records Display */}
          {selectedTable && (
            <Card className="border-zinc-800/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl text-yellow-400">
                    {selectedTable.replace('_', ' ')} Records
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <MagnifyingGlassIcon className="w-5 h-5 text-zinc-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-400"></div>
                  </div>
                ) : filteredRecords.length === 0 ? (
                  <p className="text-center text-zinc-400 py-12">No records found</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-zinc-800">
                          <th className="text-left py-3 px-4 text-zinc-400 text-sm">ID</th>
                          <th className="text-left py-3 px-4 text-zinc-400 text-sm">Data</th>
                          <th className="text-right py-3 px-4 text-zinc-400 text-sm">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRecords.map(record => (
                          <tr key={record.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                            <td className="py-3 px-4 text-zinc-300 font-mono text-sm">
                              {record.id.substring(0, 8)}...
                            </td>
                            <td className="py-3 px-4 text-zinc-300 text-sm">
                              <pre className="text-xs text-zinc-400 max-w-xl overflow-hidden text-ellipsis">
                                {JSON.stringify(record, null, 2).substring(0, 200)}...
                              </pre>
                            </td>
                            <td className="py-3 px-4 text-right">
                              {deleteConfirm === record.id ? (
                                <div className="flex items-center justify-end space-x-2">
                                  <span className="text-red-400 text-sm mr-2">Delete?</span>
                                  <Button
                                    size="sm"
                                    variant="glass"
                                    onClick={() => setDeleteConfirm(null)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                    onClick={() => deleteRecord(selectedTable, record.id)}
                                  >
                                    Confirm
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="glass"
                                  className="text-red-400 hover:text-red-300"
                                  onClick={() => setDeleteConfirm(record.id)}
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Warning */}
          <div className="mt-6 p-4 bg-red-900/20 border border-red-800/50 rounded-lg">
            <div className="flex items-start space-x-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mt-0.5" />
              <div>
                <p className="text-red-400 font-semibold">Warning</p>
                <p className="text-zinc-400 text-sm mt-1">
                  Deleting records is permanent and cannot be undone. Be careful!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseManager;