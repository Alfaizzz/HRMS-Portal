import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { libraryApi, employeeApi } from '../api';
import { Book, BookIssuance, BookRequest, User } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Table, Column } from '../components/common/Table';
import {
  BookOpen,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  RotateCcw,
  BookMarked,
  Layers,
  ArrowUpRight,
  Send,
  AlertCircle,
} from 'lucide-react';

export const LibraryManagement: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { success, error: notifyError } = useNotification();

  const [books, setBooks] = useState<Book[]>([]);
  const [issuances, setIssuances] = useState<BookIssuance[]>([]);
  const [requests, setRequests] = useState<BookRequest[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs
  const [activeTab, setActiveTab] = useState<'catalogue' | 'loans' | 'requests'>('catalogue');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);

  // Forms
  const [selectedBookForIssue, setSelectedBookForIssue] = useState<Book | null>(null);
  const [selectedBookForRequest, setSelectedBookForRequest] = useState<Book | null>(null);

  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    isbn: '',
    category: 'Software Engineering & Craftsmanship',
    totalCopies: 3,
    shelfLocation: 'Shelf A-01',
    description: '',
  });

  const [issueForm, setIssueForm] = useState({
    userId: '',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    remarks: '',
  });

  const [requestNotes, setRequestNotes] = useState('');

  const loadLibraryData = async () => {
    setLoading(true);
    try {
      const [booksData, issuancesData, requestsData] = await Promise.all([
        libraryApi.getBooks(),
        libraryApi.getIssuances(isAdmin ? undefined : user?.user_id),
        libraryApi.getRequests(isAdmin ? undefined : user?.user_id),
      ]);

      setBooks(booksData);
      setIssuances(issuancesData);
      setRequests(requestsData);

      if (isAdmin) {
        const empList = await employeeApi.getEmployees();
        setEmployees(empList);
      }
    } catch (e: any) {
      notifyError('Failed to load library records: ' + (e.message || ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLibraryData();
  }, [isAdmin, user]);

  // Add Book Handler
  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBook.title.trim() || !newBook.author.trim() || !newBook.isbn.trim()) {
      notifyError('Title, author, and ISBN are required.');
      return;
    }
    try {
      await libraryApi.addBook({
        title: newBook.title,
        author: newBook.author,
        isbn: newBook.isbn,
        category: newBook.category,
        totalCopies: Number(newBook.totalCopies) || 1,
        availableCopies: Number(newBook.totalCopies) || 1,
        shelfLocation: newBook.shelfLocation,
        description: newBook.description,
      });
      success(`Book "${newBook.title}" added to the library catalogue!`);
      setShowAddModal(false);
      setNewBook({
        title: '',
        author: '',
        isbn: '',
        category: 'Software Engineering & Craftsmanship',
        totalCopies: 3,
        shelfLocation: 'Shelf A-01',
        description: '',
      });
      loadLibraryData();
    } catch (err: any) {
      notifyError(err.message || 'Failed to add book');
    }
  };

  // Issue Book Handler (Admin)
  const handleIssueBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookForIssue || !issueForm.userId) {
      notifyError('Please select an employee to assign this book to.');
      return;
    }
    try {
      await libraryApi.issueBook({
        bookId: selectedBookForIssue.id,
        userId: issueForm.userId,
        dueDate: issueForm.dueDate,
        remarks: issueForm.remarks,
      });
      success(`"${selectedBookForIssue.title}" successfully assigned!`);
      setShowIssueModal(false);
      setSelectedBookForIssue(null);
      loadLibraryData();
    } catch (err: any) {
      notifyError(err.message || 'Failed to issue book');
    }
  };

  // Return Book Handler
  const handleReturnBook = async (issuanceId: number) => {
    if (!window.confirm('Mark this book as returned to the library?')) return;
    try {
      await libraryApi.returnBook(issuanceId);
      success('Book returned successfully and available inventory updated!');
      loadLibraryData();
    } catch (err: any) {
      notifyError(err.message || 'Failed to return book');
    }
  };

  // Request Book Handler (Employee)
  const handleRequestBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookForRequest || !user) return;
    try {
      await libraryApi.requestBook({
        bookId: selectedBookForRequest.id,
        userId: user.user_id,
        notes: requestNotes,
      });
      success(`Request submitted for "${selectedBookForRequest.title}"!`);
      setShowRequestModal(false);
      setSelectedBookForRequest(null);
      setRequestNotes('');
      loadLibraryData();
    } catch (err: any) {
      notifyError(err.message || 'Failed to request book');
    }
  };

  // Approve / Reject Request Handler (Admin)
  const handleApproveRequest = async (requestId: number) => {
    try {
      await libraryApi.updateRequestStatus(requestId, 'APPROVED');
      success('Book request approved and automatically issued!');
      loadLibraryData();
    } catch (err: any) {
      notifyError(err.message || 'Failed to approve request');
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    try {
      await libraryApi.updateRequestStatus(requestId, 'REJECTED');
      success('Book request rejected.');
      loadLibraryData();
    } catch (err: any) {
      notifyError(err.message || 'Failed to reject request');
    }
  };

  // Filtering books
  const categories = ['ALL', ...Array.from(new Set(books.map((b) => b.category)))];

  const filteredBooks = books.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.isbn.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || b.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Table columns for Active Loans
  const loanColumns: Column<BookIssuance>[] = [
    {
      key: 'bookTitle',
      label: 'Book Title',
      render: (i) => (
        <div>
          <div className="font-semibold text-slate-900 dark:text-slate-100">{i.bookTitle}</div>
          <div className="text-xs text-slate-500 font-mono">ISBN: {i.isbn}</div>
        </div>
      ),
    },
    {
      key: 'userName',
      label: 'Issued To',
      render: (i) => (
        <div>
          <div className="font-medium text-slate-900 dark:text-slate-100">{i.userName}</div>
          <div className="text-xs text-slate-500 font-mono">ID: {i.userId}</div>
        </div>
      ),
    },
    {
      key: 'issueDate',
      label: 'Issue Date',
      render: (i) => <span className="font-mono tabular-nums">{i.issueDate}</span>,
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      render: (i) => <span className="font-mono tabular-nums font-semibold">{i.dueDate}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (i) => (
        <Badge variant={i.status === 'ISSUED' ? 'warning' : 'success'} size="sm">
          {i.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Library Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Browse company reading collection, check out technical references &amp; track book loans
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              size="sm"
              onClick={() => setShowAddModal(true)}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Book to Library
            </Button>
          )}
        </div>
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Titles</span>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-1">
            {books.length}
          </div>
        </Card>
        <Card className="p-4">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Available Copies</span>
          <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {books.reduce((acc, b) => acc + (b.availableCopies || 0), 0)}
          </div>
        </Card>
        <Card className="p-4">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Loans</span>
          <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
            {issuances.filter((i) => i.status === 'ISSUED').length}
          </div>
        </Card>
        <Card className="p-4">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Pending Requests</span>
          <div className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400 mt-1">
            {requests.filter((r) => r.status === 'PENDING').length}
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('catalogue')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'catalogue'
              ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <BookMarked className="w-4 h-4" />
          <span>Book Catalogue ({books.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('loans')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'loans'
              ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{isAdmin ? 'Active Loans' : 'My Borrowed Books'} ({issuances.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'requests'
              ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Book Requests ({requests.length})</span>
        </button>
      </div>

      {/* Tab 1: Catalogue */}
      {activeTab === 'catalogue' && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search by title, author, or ISBN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            <div className="w-full sm:w-64">
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                options={categories.map((c) => ({ value: c, label: c === 'ALL' ? 'All Categories' : c }))}
              />
            </div>
          </div>

          {/* Books Grid */}
          {filteredBooks.length === 0 ? (
            <Card className="text-center py-12">
              <BookOpen className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No books found matching your query.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBooks.map((book) => {
                const isAvailable = book.availableCopies > 0;
                return (
                  <Card key={book.id} className="flex flex-col justify-between h-full p-5 hover:border-slate-400 dark:hover:border-slate-600 transition-colors">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          {book.category}
                        </span>
                        <Badge variant={isAvailable ? 'success' : 'danger'} size="sm">
                          {isAvailable ? `${book.availableCopies} Available` : 'Out of Stock'}
                        </Badge>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                        {book.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                        by <span className="font-semibold">{book.author}</span>
                      </p>

                      {book.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-3">
                          {book.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                      <div>
                        <span className="block font-mono text-[10px]">ISBN: {book.isbn}</span>
                        <span className="block text-[11px]">{book.shelfLocation}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isAdmin ? (
                          <Button
                            size="sm"
                            disabled={!isAvailable}
                            onClick={() => {
                              setSelectedBookForIssue(book);
                              setShowIssueModal(true);
                            }}
                          >
                            Assign Book
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            disabled={!isAvailable}
                            onClick={() => {
                              setSelectedBookForRequest(book);
                              setShowRequestModal(true);
                            }}
                            icon={<Send className="w-3 h-3" />}
                          >
                            Request Book
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Loans */}
      {activeTab === 'loans' && (
        <div className="space-y-4">
          <Card
            title={isAdmin ? 'Active Employee Loans & Issuances' : 'My Borrowed Books'}
            subtitle={isAdmin ? 'Track which books are currently with which employees' : 'Books currently assigned to your account'}
          >
            <Table
              columns={loanColumns}
              data={issuances}
              actions={
                isAdmin
                  ? [
                      {
                        label: 'Mark Returned',
                        onClick: (i) => handleReturnBook(i.id),
                        disabled: (i) => i.status === 'RETURNED',
                        icon: <RotateCcw className="w-3.5 h-3.5" />,
                        className: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300',
                      },
                    ]
                  : []
              }
              emptyMessage="No book issuances found."
            />
          </Card>
        </div>
      )}

      {/* Tab 3: Requests */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <Card
            title="Book Request Queue"
            subtitle="Staff requests for technical books and references"
          >
            {requests.length === 0 ? (
              <div className="text-center py-8 text-sm text-slate-500">
                No book requests found in queue.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {requests.map((r) => (
                  <div key={r.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                          {r.bookTitle}
                        </span>
                        <Badge
                          variant={
                            r.status === 'APPROVED'
                              ? 'success'
                              : r.status === 'REJECTED'
                              ? 'danger'
                              : 'warning'
                          }
                          size="sm"
                        >
                          {r.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Requested by <strong className="text-slate-700 dark:text-slate-300">{r.userName}</strong> ({r.userId}) on{' '}
                        <span className="font-mono">{r.requestDate}</span>
                        {r.notes && <span> · Note: &ldquo;{r.notes}&rdquo;</span>}
                      </p>
                    </div>

                    {isAdmin && r.status === 'PENDING' && (
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => handleApproveRequest(r.id)}
                          icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                        >
                          Approve &amp; Issue
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleRejectRequest(r.id)}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Modal: Add Book (Admin) */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Technical Book to Library"
      >
        <form onSubmit={handleAddBook} className="space-y-4">
          <Input
            label="Book Title"
            value={newBook.title}
            onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
            placeholder="e.g. Designing Data-Intensive Applications"
            required
          />
          <Input
            label="Author"
            value={newBook.author}
            onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
            placeholder="e.g. Martin Kleppmann"
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="ISBN / Serial Number"
              value={newBook.isbn}
              onChange={(e) => setNewBook({ ...newBook, isbn: e.target.value })}
              placeholder="e.g. 978-1449373320"
              required
            />
            <Input
              label="Total Copies in Inventory"
              type="number"
              min="1"
              value={newBook.totalCopies}
              onChange={(e) => setNewBook({ ...newBook, totalCopies: parseInt(e.target.value) || 1 })}
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Category"
              value={newBook.category}
              onChange={(e) => setNewBook({ ...newBook, category: e.target.value })}
              options={[
                { value: 'Software Engineering & Craftsmanship', label: 'Software Engineering' },
                { value: 'Architecture & Distributed Systems', label: 'Architecture & Systems' },
                { value: 'Cloud & Infrastructure', label: 'Cloud & Infrastructure' },
                { value: 'Engineering Leadership', label: 'Engineering Leadership' },
                { value: 'Data Science & Machine Learning', label: 'Data Science & ML' },
                { value: 'General Tech & Innovation', label: 'General Tech' },
              ]}
            />
            <Input
              label="Shelf Location"
              value={newBook.shelfLocation}
              onChange={(e) => setNewBook({ ...newBook, shelfLocation: e.target.value })}
              placeholder="e.g. Shelf A-03"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1">
              Description / Synopsis
            </label>
            <textarea
              className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100"
              rows={3}
              value={newBook.description}
              onChange={(e) => setNewBook({ ...newBook, description: e.target.value })}
              placeholder="Brief summary of the book content and significance..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Save Book
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Issue Book to Employee (Admin) */}
      <Modal
        isOpen={showIssueModal}
        onClose={() => {
          setShowIssueModal(false);
          setSelectedBookForIssue(null);
        }}
        title={`Assign "${selectedBookForIssue?.title || 'Book'}"`}
      >
        <form onSubmit={handleIssueBook} className="space-y-4">
          <p className="text-xs text-slate-500">
            Available Copies in Library: <strong>{selectedBookForIssue?.availableCopies}</strong>
          </p>

          <Select
            label="Select Employee"
            value={issueForm.userId}
            onChange={(e) => setIssueForm({ ...issueForm, userId: e.target.value })}
            options={[
              { value: '', label: '-- Select Staff Member --' },
              ...employees.map((emp) => ({
                value: emp.user_id,
                label: `${emp.first_name} ${emp.last_name} (${emp.user_id} - ${emp.job_profile})`,
              })),
            ]}
            required
          />

          <Input
            label="Due Date"
            type="date"
            value={issueForm.dueDate}
            onChange={(e) => setIssueForm({ ...issueForm, dueDate: e.target.value })}
            required
          />

          <Input
            label="Remarks / Project Notes"
            value={issueForm.remarks}
            onChange={(e) => setIssueForm({ ...issueForm, remarks: e.target.value })}
            placeholder="e.g. Q4 Distributed Architecture Study"
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowIssueModal(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Confirm Issuance
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Request Book (Employee) */}
      <Modal
        isOpen={showRequestModal}
        onClose={() => {
          setShowRequestModal(false);
          setSelectedBookForRequest(null);
        }}
        title={`Request "${selectedBookForRequest?.title || 'Book'}"`}
      >
        <form onSubmit={handleRequestBook} className="space-y-4">
          <p className="text-xs text-slate-500">
            Submit request to HR &amp; Library Administrator for book checkout approval.
          </p>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1">
              Purpose / Study Notes (Optional)
            </label>
            <textarea
              className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100"
              rows={3}
              value={requestNotes}
              onChange={(e) => setRequestNotes(e.target.value)}
              placeholder="e.g. Needed for reference on the current database sharding project..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowRequestModal(false)}>
              Cancel
            </Button>
            <Button type="submit" icon={<Send className="w-4 h-4" />}>
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LibraryManagement;
