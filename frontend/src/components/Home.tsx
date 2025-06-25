import Box from '@mui/material/Box';
import { useState } from 'react';
import Button from '@mui/joy/Button';
import Controller from './Controller';
import Add from '@mui/icons-material/Add';
import { useTranslation } from "react-i18next";
import Hero from './Hero';
import MediaPlayer from './MediaPlayer';
import MediaUploader from './MediaUploader';
import AlertState from './AlertState';
import { Progress } from './Progress';

/**
 * The Home component, which is the main entry point of the application.
 * It renders the Hero component, the MediaUploader component, the MediaPlayer component, the Controller component,
 * and the AlertState component based on the application state.
 * @returns The rendered Home component.
 */
export default function Home() {
  const [fileKey, setFileKey] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const { t } = useTranslation();
  const [showHero, setShowHero] = useState(true);
  const [mediaUploaded, setMediaUploaded] = useState(false);
  const [alert, setAlert] = useState<{ status: "Success" | "Error" | "Warning" | null; message: string; }>({ status: null, message: '' });

  const panelStyles = {
    ml: { xs: 2, sm: 5, md: 10, lg: 20, xl: 50 },
    mr: { xs: 2, sm: 5, md: 10, lg: 20, xl: 50 },
  };

  /**
  * Handles the "Get Started" button click by hiding the Hero component.
  */
  const handleGetStarted = () => {
    setShowHero(false);
  };

  /**
  * Resets the media-related state, including the file key, video URL, and media uploaded flag.
  */
  function resetMedia() {
    setFileKey('');
    setVideoUrl(null);
    setMediaUploaded(false);
  }

  /**
   * Resets the alert state by setting the status to null and the message to an empty string.
   */
  function resetAlert() {
    setAlert({
      status: null,
      message: ''
    });
  }

  return (
    <Box>
      <Hero showHero={showHero} handleGetStarted={handleGetStarted} />
      {!showHero &&
        <Box>
          <AlertState status={alert.status} message={alert.message} resetAlert={resetAlert} />
          {fileKey && videoUrl ?
            <Box sx={panelStyles}>
              <Button variant="outlined" size="lg" style={{ height: '55px', width: '20%', minWidth: '250px' }}
                sx={{ m: 4 }} disabled={!mediaUploaded} startDecorator={<Add />} onClick={() => { resetMedia() }}>{t("page.upload.upload_another")}</Button>
              <MediaPlayer fileKey={fileKey} videoUrl={videoUrl} />
              {mediaUploaded ?
                (<Controller videoFileKey={fileKey} setAlert={setAlert} />)
                : <Progress />}
            </Box>
            :
            <Box>
              <MediaUploader setFileKey={setFileKey} setVideoUrl={setVideoUrl} setMediaUploaded={setMediaUploaded} setAlert={setAlert}></MediaUploader>
            </Box>
          }
        </Box>
      }
    </Box>
  );
}

