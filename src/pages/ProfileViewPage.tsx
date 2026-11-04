import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  personalDetailsApi,
  bankDetailsApi,
  educationApi,
  experienceApi,
  assetsApi,
} from '../api';
import {
  User,
  BankDetails,
  EducationalDetails,
  Experience,
  CompanyAsset,
} from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import {
  User as UserIcon,
  Camera,
  Briefcase,
  GraduationCap,
  Landmark,
  Laptop,
  CheckCircle2,
  Mail,
  Phone,
  Calendar,
  MapPin,
} from 'lucide-react';

export const ProfileViewPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error: notifyError } = useNotification();

  const [profile, setProfile] = useState<User | null>(null);
  const [bank, setBank] = useState<BankDetails | null>(null);
  const [edu, setEdu] = useState<EducationalDetails | null>(null);
  const [exp, setExp] = useState<Experience[]>([]);
  const [assets, setAssets] = useState<CompanyAsset[]>([]);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadProfile = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const [profData, bankData, eduData, expData, assetsData, photoData] =
          await Promise.allSettled([
            personalDetailsApi.getPersonalDetails(user.user_id),
            bankDetailsApi.getBankDetails(user.user_id),
            educationApi.getEducation(user.user_id),
            experienceApi.getExperience(user.user_id),
            assetsApi.getAssets(user.user_id),
            personalDetailsApi.getProfilePicture(user.user_id),
          ]);

        if (!mounted) return;

        if (profData.status === 'fulfilled') setProfile(profData.value);
        if (bankData.status === 'fulfilled') setBank(bankData.value);
        if (eduData.status === 'fulfilled') setEdu(eduData.value);
        if (expData.status === 'fulfilled') setExp(expData.value);
        if (assetsData.status === 'fulfilled') setAssets(assetsData.value);
        if (photoData.status === 'fulfilled') setPhotoUrl(photoData.value);
      } catch (err: any) {
        notifyError('Failed to load profile details: ' + (err.message || ''));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProfile();
    return () => {
      mounted = false;
    };
  }, [user]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      const url = await personalDetailsApi.uploadProfilePicture(user.user_id, file);
      setPhotoUrl(url);
      success('Profile picture updated successfully!');
    } catch (err: any) {
      notifyError('Failed to upload picture: ' + err.message);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header Profile Card */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar with upload hover */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-3xl font-bold text-slate-700 dark:text-slate-200 shadow-sm">
              {photoUrl ? (
                <img src={photoUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user.first_name ? user.first_name[0] : 'U'
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 rounded-full bg-slate-900/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-xs"
              title="Change profile photo"
            >
              <Camera className="w-5 h-5 mb-0.5" />
              <span>Change</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {profile?.first_name || user.first_name} {profile?.last_name || user.last_name}
              </h1>
              <Badge variant={user.role === 'ADMIN' ? 'info' : 'success'}>
                {user.role}
              </Badge>
              <Badge variant="neutral">
                {profile?.status || user.status}
              </Badge>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 font-medium">
              {profile?.job_profile || user.job_profile} · Dept: {profile?.department_id || user.department_id}
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-500 mt-3">
              <span className="flex items-center gap-1 font-mono">
                <UserIcon className="w-3.5 h-3.5" />
                <span>ID: {user.user_id}</span>
              </span>
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                <span>{profile?.email_id || user.email_id}</span>
              </span>
              <span className="flex items-center gap-1 font-mono">
                <Phone className="w-3.5 h-3.5" />
                <span>{profile?.mobile_number || user.mobile_number}</span>
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Profile Details Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Credentials */}
        <Card title="Personal Information">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block">Father's Name</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{profile?.father_name || '—'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Mother's Name</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{profile?.mother_name || '—'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Date of Birth</span>
              <span className="font-semibold font-mono text-slate-900 dark:text-slate-100">{profile?.dob || '—'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Date of Joining</span>
              <span className="font-semibold font-mono text-slate-900 dark:text-slate-100">{profile?.doj || '—'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Blood Group</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{profile?.blood_group || '—'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">PAN Card Number</span>
              <span className="font-semibold font-mono text-slate-900 dark:text-slate-100">{profile?.pan_number || '—'}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500 block">Current Address</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">{profile?.current_address || '—'}</span>
            </div>
          </div>
        </Card>

        {/* Bank & Payment Details */}
        <Card title="Bank Account Details">
          {bank ? (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Bank Name</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{bank.bank_name}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Account Number</span>
                <span className="font-semibold font-mono text-slate-900 dark:text-slate-100">{bank.account_number}</span>
              </div>
              <div>
                <span className="text-slate-500 block">IFSC Code</span>
                <span className="font-semibold font-mono text-slate-900 dark:text-slate-100">{bank.ifsc_code}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Branch Name</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{bank.branch_name}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">No bank record associated.</p>
          )}
        </Card>

        {/* Educational Credentials */}
        <Card title="Educational Qualifications">
          {edu ? (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Degree / College</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{edu.bachelorcollegename || 'Undergraduate'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Bachelor's Score</span>
                <span className="font-semibold font-mono text-slate-900 dark:text-slate-100">{edu.bachelor}%</span>
              </div>
              <div>
                <span className="text-slate-500 block">Secondary School</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{edu.highschoolname || 'High School'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">High School Score</span>
                <span className="font-semibold font-mono text-slate-900 dark:text-slate-100">{edu.highschool}%</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">No education record associated.</p>
          )}
        </Card>

        {/* Assigned Hardware */}
        <Card title="Assigned Hardware &amp; Assets">
          {assets.length === 0 ? (
            <p className="text-xs text-slate-500">No company assets currently issued to your account.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {assets.map((a) => (
                <div key={a.asset_id} className="py-2 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{a.asset_name}</span>
                    <span className="text-slate-400 block font-mono">Tag: {a.asset_id} · {a.asset_type}</span>
                  </div>
                  <Badge variant="neutral" size="sm">{a.asset_issue_date}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ProfileViewPage;
