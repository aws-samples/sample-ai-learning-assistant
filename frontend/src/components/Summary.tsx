import React from 'react';
import { Box, Typography, Grid } from '@mui/joy';
import AudioPlayer from 'react-audio-player';
import { LANGUAGE_CODE_MAP, isRTL } from '../utils/languageUtils';

/**
 * Props for the Summary component.
 * @property originalSummary - The original summary text.
 * @property translatedSummary - The translated summary text (if available).
 * @property originalLanguage - The original language of the summary.
 * @property selectedLanguage - The currently selected language.
 * @property summaryAudio - The audio for the summary (if available).
 * @property translatedSummaryAudio - The audio for the translated summary (if available).
 * @property showSummary - Whether to show the summary panel.
 */
interface SummaryProps {
    originalSummary: string;
    translatedSummary: string | null;
    originalLanguage: string | null;
    selectedLanguage: string | null;
    summaryAudio: string | null;
    translatedSummaryAudio: string | null;
    showSummary: boolean;
}



/**
 * The Summary component, which renders the summary text and, if available, the translated summary and audio.
 * It also handles the right-to-left (RTL) layout for languages that require it.
 * @param props - The props for the Summary component.
 * @returns The rendered Summary component.
 */
const Summary: React.FC<SummaryProps> = ({
    originalSummary,
    translatedSummary,
    originalLanguage,
    selectedLanguage,
    summaryAudio,
    translatedSummaryAudio,
    showSummary
}) => {

    return (
        <Box sx={{ mt: '30px', mb: '30px' }}>
            {showSummary && (
                <Grid container spacing={2} dir={(originalLanguage && isRTL(LANGUAGE_CODE_MAP[originalLanguage])) ? 'rtl' : ''}>
                    {/* Original text column */}
                    {showSummary && (
                        <Grid xs={12} md={originalLanguage !== selectedLanguage && translatedSummary ? 6 : 12}  >
                            {(summaryAudio || translatedSummaryAudio) && (
                                <Box sx={{ height: '80px' }} >
                                    {summaryAudio &&
                                        <AudioPlayer src={summaryAudio} controls />
                                    }
                                </Box>
                            )}
                            {
                                (originalSummary?.split(/\n+/).map((line, index) => {
                                    return (
                                        <Box key={index} component="section" sx={{ mt: 1 }}>
                                            <Typography key={index} textAlign="justify" level={line.trim().endsWith(':') ? "h4" : "body-md"} >
                                                {line}
                                            </Typography>
                                        </Box>
                                    );
                                }))
                            }
                        </Grid>
                    )}
                    {/* Translation column (if available) */}
                    {showSummary && translatedSummary && originalLanguage !== selectedLanguage && (
                        <Grid xs={12} md={6} dir={(selectedLanguage && isRTL(LANGUAGE_CODE_MAP[selectedLanguage])) ? 'rtl' : ''}>
                            <Box >
                                {(summaryAudio || translatedSummaryAudio) && (
                                    <Box sx={{ height: '80px' }} >
                                        {translatedSummaryAudio &&
                                            <AudioPlayer src={translatedSummaryAudio} controls />
                                        }
                                    </Box>
                                )}
                                {(translatedSummary?.split(/\n+/).map((line, index) => {
                                    return (
                                        <Box key={index} component="section" sx={{ mt: 1 }}>
                                            <Typography key={index} textAlign="justify" level={line.trim().endsWith(':') ? "h4" : "body-md"} >
                                                {line}
                                            </Typography>
                                        </Box>
                                    );
                                }))}
                            </Box>
                        </Grid>
                    )}
                </Grid>
            )}
        </Box>
    );
}

export default Summary;
