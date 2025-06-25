import React from 'react';
import ReactAudioPlayer from 'react-audio-player';
import { isAudio } from '../utils/fileTypeUtils';
import { Box } from '@mui/joy';

/**
 * Props for the MediaPlayer component.
 * @property fileKey - The key of the file to be played.
 * @property videoUrl - The URL of the video to be played.
 */
interface MediaPlayerProps {
  fileKey: string;
  videoUrl: string;
}

/**
 * The MediaPlayer component, which renders either an audio or video player based on the file type.
 * If the file is an audio file, it renders an audio player. If the file is a video file, it renders a video player.
 * @param props - The props for the MediaPlayer component.
 * @returns The rendered MediaPlayer component.
 */
const MediaPlayer: React.FC<MediaPlayerProps> = ({ fileKey, videoUrl }) => {
  return (
    <Box>
      {videoUrl && (isAudio(fileKey) ?
        (<ReactAudioPlayer controls src={videoUrl} style={{ width: '80%', margin: '0 auto' }} />)
        :
        (<video controls width="75%" height="auto" src={videoUrl} />)
      )}
    </Box>
  );
};

export default MediaPlayer;









