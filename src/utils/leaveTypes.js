// Leave Types with specific rules
export const LEAVE_TYPES = [
  {
    value: 'SICK',
    label: 'Sick Leave',
    maxDays: 7,
    requiresDocumentation: false,
    description: 'For health-related absences',
    color: '#3b82f6',
    icon: '🤒'
  },
  {
    value: 'CASUAL',
    label: 'Casual Leave',
    maxDays: 5,
    requiresDocumentation: false,
    description: 'For personal or casual reasons',
    color: '#10b981',
    icon: '😊'
  },
  {
    value: 'ANNUAL',
    label: 'Annual Leave',
    maxDays: 30,
    requiresDocumentation: false,
    description: 'Paid annual vacation',
    color: '#8b5cf6',
    icon: '🏖️'
  },
  {
    value: 'MATERNITY',
    label: 'Maternity Leave',
    maxDays: 90,
    requiresDocumentation: true,
    description: 'For expecting mothers',
    color: '#ec4899',
    icon: '🤰'
  },
  {
    value: 'PATERNITY',
    label: 'Paternity Leave',
    maxDays: 14,
    requiresDocumentation: true,
    description: 'For new fathers',
    color: '#8b5cf6',
    icon: '👨‍👦'
  },
  {
    value: 'STUDY',
    label: 'Study Leave',
    maxDays: 30,
    requiresDocumentation: true,
    description: 'For educational purposes',
    color: '#6366f1',
    icon: '📚'
  },
  {
    value: 'BEREAVEMENT',
    label: 'Bereavement Leave',
    maxDays: 5,
    requiresDocumentation: false,
    description: 'For family bereavement',
    color: '#6b7280',
    icon: '⚫'
  },
  {
    value: 'EMERGENCY',
    label: 'Emergency Leave',
    maxDays: 3,
    requiresDocumentation: false,
    description: 'For urgent personal emergencies',
    color: '#f59e0b',
    icon: '🚨'
  }
];

// Helper function to get leave type by value
export const getLeaveType = (value) => {
  return LEAVE_TYPES.find(type => type.value === value) || 
         LEAVE_TYPES.find(type => type.label === value) || 
         { label: value, maxDays: 30 }; // Default
};
