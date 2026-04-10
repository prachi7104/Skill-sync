'use client';

import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import { Pencil, X, Save, Loader2, Hash, Calendar } from 'lucide-react';

interface ProfileHeaderProps {
  name: string;
  email: string;
  sapId?: string | null;
  rollNo?: string | null;
  batchYear?: number | null;
  branch?: string | null;
  completeness: number;           // 0-100 integer
  isEditing: boolean;
  isLoading: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function ProfileHeader({
  name, email, sapId, rollNo, batchYear, branch,
  completeness, isEditing, isLoading, onEdit, onSave, onCancel
}: ProfileHeaderProps) {
  const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'ST';

  const ringData = [
    { value: completeness, fill: 'hsl(var(--primary))' },
    { value: 100 - completeness, fill: 'hsl(var(--muted))' },
  ];

  const completenessColor =
    completeness >= 80 ? 'text-success' :
    completeness >= 50 ? 'text-warning' : 'text-destructive';

  return (
    <div className='bg-card border border-border rounded-lg p-5 sm:p-6'>
      <div className='flex flex-col sm:flex-row items-start sm:items-center gap-5'>

        {/* Avatar + Ring */}
        <div className='relative shrink-0 w-20 h-20'>
          <ResponsiveContainer width='100%' height='100%'>
            <RadialBarChart
              cx='50%' cy='50%'
              innerRadius='70%' outerRadius='100%'
              startAngle={90} endAngle={-270}
              data={ringData}
              barSize={5}
            >
              <RadialBar dataKey='value' cornerRadius={4} isAnimationActive={false} />
            </RadialBarChart>
          </ResponsiveContainer>
          {/* Initials centered over ring */}
          <div className='absolute inset-[10px] rounded-full bg-primary flex items-center justify-center'>
            <span className='text-sm font-bold text-white tracking-wide'>{initials}</span>
          </div>
        </div>

        {/* Name + metadata */}
        <div className='flex-1 min-w-0'>
          <div className='flex items-start justify-between gap-4'>
            <div>
              <h2 className='text-xl font-semibold text-foreground leading-tight'>{name}</h2>
              <p className='text-sm text-muted-foreground mt-0.5'>{email}</p>
            </div>
            {/* Completion badge */}
            <span className={`text-sm font-bold shrink-0 ${completenessColor}`}>
              {completeness}% complete
            </span>
          </div>

          {/* Metadata pills */}
          <div className='flex flex-wrap gap-2 mt-3'>
            {sapId && (
              <span className='inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground bg-muted/60 border border-border rounded px-2.5 py-1'>
                <Hash size={10} /> SAP {sapId}
              </span>
            )}
            {rollNo && (
              <span className='inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground bg-muted/60 border border-border rounded px-2.5 py-1'>
                <Hash size={10} /> {rollNo}
              </span>
            )}
            {branch && (
              <span className='inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground bg-muted/60 border border-border rounded px-2.5 py-1'>
                {branch}
              </span>
            )}
            {batchYear && (
              <span className='inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground bg-muted/60 border border-border rounded px-2.5 py-1'>
                <Calendar size={10} /> Batch {batchYear}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons — full width row below on mobile */}
      <div className='flex items-center gap-2 mt-4 pt-4 border-t border-border'>
        {!isEditing ? (
          <button
            onClick={onEdit}
            className='inline-flex items-center gap-2 h-8 px-3 rounded text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors'
          >
            <Pencil size={13} /> Edit Profile
          </button>
        ) : (
          <>
            <button
              onClick={onSave}
              disabled={isLoading}
              className='inline-flex items-center gap-2 h-8 px-3 rounded text-sm font-medium bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors'
            >
              {isLoading ? <Loader2 size={13} className='animate-spin' /> : <Save size={13} />}
              Save Changes
            </button>
            <button
              onClick={onCancel}
              disabled={isLoading}
              className='inline-flex items-center gap-2 h-8 px-3 rounded text-sm font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors'
            >
              <X size={13} /> Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}
