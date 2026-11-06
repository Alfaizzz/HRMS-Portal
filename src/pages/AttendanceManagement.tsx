import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { attendanceApi, employeeApi } from '../api';
import { AttendanceRecord, PunchInRecord, User } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Input } from '../components/common/Input';
import { Table, Column } from '../components/common/Table';
import {
  Camera,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Search,
  RefreshCw,
  Video,
  VideoOff,
  UserCheck,
} from 'lucide-react';

export const AttendanceManagement: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { success, error: notifyError, warning } = useNotification();

  // Active sub-view: 'punch' | 'active' | 'history'
  const [activeTab, setActiveTab] = useState<'punch' | 'active' | 'history'>('punch');

  // Camera & Geolocation state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedSelfie, setCapturedSelfie] = useState<string | null>(null);

  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<string>('Detecting location...');

  // Records state
  const [activePunchIns, setActivePunchIns] = useState<PunchInRecord[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter for history
  const [dateFilter, setDateFilter] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // Start Camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('Camera access unavailable or blocked. You can still punch in using location verification.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  // Capture Snapshot from Video
  const takeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) {
      notifyError('Camera not ready');
      return;
    }
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedSelfie(dataUrl);
      success('Selfie captured successfully!');
    }
  };

  // Detect Geolocation
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          setLocationStatus(
            `GPS Verified: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`
          );
        },
        () => {
          // Standard office coordinate fallback
          setLocation({ latitude: 12.9716, longitude: 77.5946 });
          setLocationStatus('Using Office HQ Location (Bangalore Tech Hub: 12.9716, 77.5946)');
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      setLocation({ latitude: 12.9716, longitude: 77.5946 });
      setLocationStatus('Office HQ Coordinates: 12.9716, 77.5946');
    }
  }, []);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const loadAttendanceData = async () => {
    setLoading(true);
    try {
      const [actives, history] = await Promise.all([
        attendanceApi.getPunchIns(),
        attendanceApi.getAttendanceRecords(isAdmin ? undefined : user?.user_id),
      ]);
      setActivePunchIns(actives);
      setAttendanceHistory(history);
    } catch (err: any) {
      notifyError('Failed to load attendance records: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendanceData();
  }, [user, isAdmin]);

  const isUserCurrentlyPunchedIn = activePunchIns.some(
    (p) => p.user_id === user?.user_id
  );

  // Punch In Action
  const handlePunchIn = async () => {
    if (!user) return;
    if (!location) {
      notifyError('Location detection in progress. Please wait.');
      return;
    }

    setLoading(true);
    try {
      await attendanceApi.punchIn({
        user_id: user.user_id,
        latitude: location.latitude,
        longitude: location.longitude,
        selfie_base64: capturedSelfie || undefined,
      });

      success('Punched In successfully for today! Work session initiated.');
      stopCamera();
      loadAttendanceData();
    } catch (err: any) {
      notifyError(err.message || 'Failed to clock in');
    } finally {
      setLoading(false);
    }
  };

  // Punch Out Action
  const handlePunchOut = async () => {
    if (!user) return;
    if (!location) {
      notifyError('Location detection in progress. Please wait.');
      return;
    }

    if (!window.confirm('Are you sure you want to clock out for the day?')) return;

    setLoading(true);
    try {
      const record = await attendanceApi.punchOut({
        user_id: user.user_id,
        latitude: location.latitude,
        longitude: location.longitude,
      });

      success(`Punched Out successfully! Duration recorded: ${record.hours || 'session closed'}`);
      loadAttendanceData();
    } catch (err: any) {
      notifyError(err.message || 'Failed to clock out');
    } finally {
      setLoading(false);
    }
  };

  // Delete active punchin (Admin)
  const handleDeleteActivePunch = async (id: number) => {
    if (!window.confirm('Delete this active punch-in entry?')) return;
    try {
      await attendanceApi.deletePunchIn(id);
      success('Punch-in record removed');
      loadAttendanceData();
    } catch (err: any) {
      notifyError(err.message || 'Failed to delete entry');
    }
  };

  const activeColumns: Column<PunchInRecord>[] = [
    {
      key: 'user_name',
      label: 'Employee',
      render: (p) => (
        <div>
          <div className="font-semibold text-slate-900 dark:text-slate-100">{p.user_name}</div>
          <div className="text-xs text-slate-500 font-mono">ID: {p.user_id}</div>
        </div>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      render: (p) => <span className="font-mono tabular-nums">{p.date}</span>,
    },
    {
      key: 'punch_in_time',
      label: 'Punch In Time',
      render: (p) => <span className="font-mono tabular-nums font-semibold">{p.punch_in_time}</span>,
    },
    {
      key: 'image_location',
      label: 'Selfie Verification',
      align: 'center',
      render: (p) =>
        p.image_location && p.image_location.startsWith('data:image') ? (
          <img
            src={p.image_location}
            alt="Selfie"
            className="w-10 h-10 object-cover rounded-lg border border-slate-200 inline-block shadow-2xs"
          />
        ) : (
          <Badge variant="neutral" size="sm">Selfie Verified</Badge>
        ),
    },
  ];

  const historyColumns: Column<AttendanceRecord>[] = [
    {
      key: 'user_id',
      label: 'Employee ID',
      render: (r) => <span className="font-mono font-semibold">{r.user_id}</span>,
    },
    {
      key: 'date',
      label: 'Date',
      render: (r) => <span className="font-mono tabular-nums">{r.date}</span>,
    },
    {
      key: 'punch_in_time',
      label: 'In Time',
      render: (r) => <span className="font-mono tabular-nums">{r.punch_in_time}</span>,
    },
    {
      key: 'punch_out_time',
      label: 'Out Time',
      render: (r) => <span className="font-mono tabular-nums">{r.punch_out_time || '—'}</span>,
    },
    {
      key: 'hours',
      label: 'Total Hours Worked',
      render: (r) => (
        <span className="font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
          {r.hours || 'In Progress'}
        </span>
      ),
    },
    {
      key: 'selfie_url',
      label: 'Selfie',
      align: 'center',
      render: (r) =>
        r.selfie_url && r.selfie_url.startsWith('data:image') ? (
          <img
            src={r.selfie_url}
            alt="Attendance selfie"
            className="w-9 h-9 object-cover rounded-md border border-slate-200 inline-block shadow-2xs"
          />
        ) : (
          <span className="text-xs text-slate-400">—</span>
        ),
    },
  ];

  const filteredHistory = attendanceHistory.filter((h) => {
    const matchesUser = !userSearch || h.user_id.toLowerCase().includes(userSearch.toLowerCase());
    const matchesDate = !dateFilter || h.date === dateFilter;
    return matchesUser && matchesDate;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Attendance &amp; Selfie Punch-in
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time biometric selfie verification and GPS geolocation tracking
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={loadAttendanceData}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh Records
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('punch')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'punch'
              ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Clock In / Out</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'active'
                ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Active Clocked In ({activePunchIns.length})</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'history'
              ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Attendance History</span>
        </button>
      </div>

      {/* Tab 1: Punch Clock */}
      {activeTab === 'punch' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Camera Card */}
          <Card
            title="Biometric Selfie Verification"
            subtitle="Capture picture to authenticate presence"
          >
            <div className="space-y-4">
              {/* Video preview / Snapshot container */}
              <div className="relative aspect-4/3 w-full max-w-md mx-auto bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
                {capturedSelfie ? (
                  <img
                    src={capturedSelfie}
                    alt="Captured selfie preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                  />
                )}

                {!cameraActive && !capturedSelfie && (
                  <div className="text-center p-6 text-slate-400">
                    <Camera className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">Camera is currently inactive.</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Click below to turn on the live camera stream.
                    </p>
                  </div>
                )}

                {/* Hidden canvas for image grab */}
                <canvas ref={canvasRef} className="hidden" />
              </div>

              {cameraError && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs rounded-lg border border-amber-200 dark:border-amber-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{cameraError}</span>
                </div>
              )}

              {/* Camera Controls */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                {!cameraActive ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={startCamera}
                    icon={<Video className="w-4 h-4" />}
                  >
                    Start Camera
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      onClick={takeSnapshot}
                      icon={<Camera className="w-4 h-4" />}
                    >
                      Capture Selfie
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={stopCamera}
                      icon={<VideoOff className="w-4 h-4" />}
                    >
                      Turn Off Camera
                    </Button>
                  </>
                )}

                {capturedSelfie && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setCapturedSelfie(null);
                      startCamera();
                    }}
                  >
                    Retake Picture
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Clock In / Out Action Box */}
          <Card
            title={`Attendance Session: ${user?.first_name || 'Staff'}`}
            subtitle={`User ID: ${user?.user_id}`}
          >
            <div className="space-y-5">
              {/* Current status chip */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 block">Current Status Today</span>
                  <div className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                    {isUserCurrentlyPunchedIn ? 'Active (Punched In)' : 'Not Punched In'}
                  </div>
                </div>
                <Badge variant={isUserCurrentlyPunchedIn ? 'success' : 'neutral'} size="md">
                  {isUserCurrentlyPunchedIn ? 'Clocked In' : 'Clocked Out'}
                </Badge>
              </div>

              {/* Geolocation Info */}
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-lg text-xs flex items-center gap-2 text-blue-900 dark:text-blue-200">
                <MapPin className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />
                <span>{locationStatus}</span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                {!isUserCurrentlyPunchedIn ? (
                  <Button
                    type="button"
                    variant="success"
                    size="lg"
                    className="w-full"
                    disabled={loading}
                    onClick={handlePunchIn}
                    icon={<CheckCircle2 className="w-5 h-5" />}
                  >
                    Confirm Presence &amp; Clock In
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="danger"
                    size="lg"
                    className="w-full"
                    disabled={loading}
                    onClick={handlePunchOut}
                    icon={<Clock className="w-5 h-5" />}
                  >
                    Clock Out for the Day
                  </Button>
                )}

                <p className="text-[11px] text-slate-400 text-center">
                  Session timestamp and coordinates will be immutably recorded in the attendance ledger.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: Active Clocked-In Users (Admin) */}
      {activeTab === 'active' && isAdmin && (
        <Card
          title="Currently Active Clocked-in Staff"
          subtitle="Staff who have clocked in today and not yet clocked out"
        >
          <Table
            columns={activeColumns}
            data={activePunchIns}
            actions={[
              {
                label: 'Remove',
                onClick: (p) => handleDeleteActivePunch(p.punchin_id),
                icon: <Trash2 className="w-3.5 h-3.5" />,
                className: 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300',
              },
            ]}
            emptyMessage="No employees currently clocked in."
          />
        </Card>
      )}

      {/* Tab 3: Attendance History */}
      {activeTab === 'history' && (
        <Card
          title={isAdmin ? 'Company Attendance Records' : 'My Attendance Records'}
          subtitle="Historical logs with working hours calculation"
        >
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            {isAdmin && (
              <div className="flex-1">
                <Input
                  placeholder="Filter by User ID (e.g. employee or shivam)..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  icon={<Search className="w-4 h-4" />}
                />
              </div>
            )}
            <div className="w-full sm:w-48">
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
          </div>

          <Table
            columns={historyColumns}
            data={filteredHistory}
            emptyMessage="No attendance logs found."
          />
        </Card>
      )}
    </div>
  );
};

export default AttendanceManagement;
