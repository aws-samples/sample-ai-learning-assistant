import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import * as React from 'react';
import Alert from '@mui/joy/Alert';
import IconButton from '@mui/joy/IconButton';
import Typography from '@mui/joy/Typography';
import { Box } from '@mui/joy';

/**
 * Defines the available status types for the alert component.
 * Each status has a color, title, and corresponding icon.
 */
export const Status = {
  Success: { color: 'success', title: 'Success', icon: <CheckCircleIcon /> },
  Warning: { color: 'warning', title: 'Warning', icon: <WarningIcon /> },
  Error: { color: 'danger', title: 'Error', icon: <InfoIcon /> },
} as const;

/**
 * The type representing the available status keys.
 */
type StatusKey = keyof typeof Status;

/**
 * The props for the AlertState component.
 * @property status - The current status of the alert, or null if no alert is being shown.
 * @property message - The message to be displayed in the alert.
 * @property resetAlert - A function to reset the alert state and hide the alert.
 */
interface AlertStateProps {
  status: StatusKey | null;
  message: string;
  resetAlert(): void;
}

/**
 * The AlertState component, which displays an alert based on the provided status and message.
 * @param props - The props for the AlertState component.
 * @returns The alert component, or null if no alert is being shown.
 */
const AlertState: React.FC<AlertStateProps> = ({
  status,
  message,
  resetAlert
}) => {
  if (status) {
    const { color, title, icon } = Status[status];
    return (
      <Box sx={{ display: 'flex', width: '100%', justifyContent: 'center', alignItems: 'center', textAlign: 'left'}}>
      <Alert
        sx={{ alignItems: 'center', width: '60%', p:2, mt:4, 
        justifyContent: 'center', // Center the alert horizontally
       }} 
        startDecorator={icon}
        variant="soft"
        color={color} 
        endDecorator={
          <IconButton variant="soft" color={color} onClick={resetAlert}>
            <CloseRoundedIcon />
          </IconButton>
        }
      >  
        <div>
          <div>{title}</div>
          <Typography level="body-sm" color={color}>
            {message}
          </Typography>
        </div>
      </Alert>
      </Box>

    );
  } else {
    return null;
  }
};

export default AlertState;
