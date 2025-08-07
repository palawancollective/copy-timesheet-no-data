// Utility functions for status colors and badges using semantic tokens

export const getWorkStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'Working':
      return 'info'
    case 'On lunch':
      return 'warning'
    case 'Finished':
      return 'secondary'
    default:
      return 'destructive'
  }
}

export const getPaidStatusBadgeVariant = (isPaid: boolean) => {
  return isPaid ? 'success' : 'warning'
}

export const getWorkHoursTextColor = (status: string) => {
  return status === 'Working' || status === 'On lunch' 
    ? 'text-info' 
    : 'text-foreground'
}