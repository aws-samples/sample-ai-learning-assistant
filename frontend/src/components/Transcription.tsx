import React from 'react';
import { Box, Typography, Grid } from '@mui/joy';
import AudioPlayer from 'react-audio-player';
import { LANGUAGE_CODE_MAP, isRTL } from '../utils/languageUtils';

/**
 * Props for the Transcription component.
 * @property originalTranscription - The original transcription text.
 * @property translatedTranscription - The translated transcription text (if available).
 * @property originalLanguage - The original language of the transcription.
 * @property selectedLanguage - The currently selected language.
 * @property translatedAudio - The audio for the translated transcription (if available).
 * @property showTranscript - Whether to show the transcription panel.
 */
interface TranscriptionProps {
    originalTranscription: string;
    translatedTranscription: string | null;
    originalLanguage: string | null;
    selectedLanguage: string | null;
    translatedAudio: string | null;
    showTranscript: boolean
}

/**
 * The Transcription component, which renders the original transcription text and, if available, the translated transcription text and audio.
 * It also handles the right-to-left (RTL) layout for languages that require it.
 * @param props - The props for the Transcription component.
 * @returns The rendered Transcription component.
 */
const Transcription: React.FC<TranscriptionProps> = ({
    originalTranscription,
    translatedTranscription,
    originalLanguage,
    selectedLanguage,
    translatedAudio,
    showTranscript
}) => {

    return (
        <Box sx={{mt: '30px', mb: '30px'}} >
            {showTranscript && (
                <Grid container spacing={2} >
                    {/* Original text column */}
                    {showTranscript && <Grid xs={12} md={originalLanguage !== selectedLanguage && translatedTranscription ? 6 : 12}  >
                        <Box>
                            {showTranscript && translatedTranscription && originalLanguage !== selectedLanguage && translatedAudio &&
                            ( <Box sx={{height: '80px'}} />)}
                            <Typography level="body-md" sx={{textAlign:(originalLanguage && isRTL(LANGUAGE_CODE_MAP[originalLanguage]) ? 'right' : 'justify')}}> {originalTranscription}  </Typography>
                        </Box>
                    </Grid>
                    }
                    {/* Translation column (if available) */}
                    {showTranscript && translatedTranscription && originalLanguage !== selectedLanguage && (
                        <Grid xs={12} md={6} >
                            <Box>
                            { translatedAudio && (
                                <Box sx={{height: '80px'}} >
                                 <AudioPlayer src={translatedAudio} controls />
                                </Box>
                                )
                            }
                                <Typography level="body-md" sx={{textAlign:(selectedLanguage && isRTL(LANGUAGE_CODE_MAP[selectedLanguage]) ? 'right' : 'justify')}}> {translatedTranscription} </Typography>
                            </Box>
                        </Grid>
                    )}
                </Grid>
            )}
        </Box>
    );
};

export default Transcription;
