import { Box, CircularProgress, Typography } from '@mui/joy';
import { useTranslation } from 'react-i18next';

/**
 * The Progress component, which displays a circular progress indicator and a "Uploading media" message.
 * This component is typically used to indicate that a media file is being uploaded.
 * @returns The rendered Progress component.
 */
export const Progress = () => {
  const { t } = useTranslation();
  return (
    <Box sx={{mt: '30px', mb: '60px'}} >
      <CircularProgress />
      <Typography level="body-md" sx={{ mt: 1 }}>{t("page.upload.uploading_media")}</Typography>
    </Box>
  );
};
