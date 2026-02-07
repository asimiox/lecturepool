import React from 'react';
import { LectureStatus } from '../types';
import { Clock, CheckCircle, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: LectureStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'approved':
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-navy-100 text-navy-900 border border-navy-200 shadow-sm">
          <CheckCircle size={12} className="mr-1.5" />
          Approved
        </span>
      );
    case 'rejected':
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-maroon-100 text-maroon-900 border border-maroon-200 shadow-sm">
          <XCircle size={12} className="mr-1.5" />
          Rejected
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-gray-200 text-gray-700 border border-gray-300 shadow-sm">
          <Clock size={12} className="mr-1.5" />
          Pending
        </span>
      );
  }
};