import React from 'react';
import { Grid, Autocomplete, Box, CircularProgress, FormControl, FormLabel, IconButton, Tooltip, Typography } from '@mui/joy';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import { useTranslation } from 'react-i18next';

/**
 * Props for the Translation component.
 * @property transcriptionJobName - The name of the transcription job.
 * @property originalLanguage - The original language of the transcription.
 * @property selectedLanguage - The currently selected language.
 * @property languages - The list of available languages.
 * @property handleTranslateSelected - A function to handle the selection of a language for translation.
 * @property setSelectedLanguage - A function to set the selected language.
 */
interface TranslationProps {
    transcriptionJobName: string;
    originalLanguage: string;
    selectedLanguage: string;
    languages: string[];
    loading: boolean;
    handleTranslateSelected: (previousLanguage: string, selectedLanguage: string) => void;
    setSelectedLanguage: React.Dispatch<React.SetStateAction<string | null>>;
    setPreviousLanguage: React.Dispatch<React.SetStateAction<string | null>>;
}

/**
 * The Translation component, which renders a language selector dropdown.
 * The dropdown is disabled if the transcription job name or original language are not available.
 * When the user selects a language, the `handleTranslateSelected` function is called with the selected language.
 * @param props - The props for the Translation component.
 * @returns The rendered Translation component.
 */
const Translation: React.FC<TranslationProps> = ({
    transcriptionJobName,
    originalLanguage,
    selectedLanguage,
    languages,
    loading,
    handleTranslateSelected,
    setSelectedLanguage,
    setPreviousLanguage
}) => {
    const { t } = useTranslation();
    return (
        <Grid xs>
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                gap={1} // Add spacing between Autocomplete and Tooltip
            >
                {transcriptionJobName && originalLanguage &&
                    (
                        <FormControl style={{ width: "100%" }}>
                            <FormLabel>{t("page.video.language")}</FormLabel>
                            <Grid container>
                                <Grid xs={11}>
                                    <Autocomplete
                                        value={selectedLanguage}
                                        onInputChange={(_event, newInputValue) => {
                                            if (newInputValue && languages.includes(newInputValue)) {
                                                const tempPreviousLanguage = selectedLanguage;
                                                setPreviousLanguage(selectedLanguage);
                                                setSelectedLanguage(newInputValue);
                                                handleTranslateSelected(tempPreviousLanguage, newInputValue);
                                            }
                                        }}
                                        disabled={loading}
                                        loading={loading}
                                        endDecorator={loading && (selectedLanguage != originalLanguage) && <CircularProgress size="sm" />}
                                        autoHighlight
                                        disableClearable={true}
                                        options={languages}
                                        style={{ height: '55px', width: "100%" }}
                                    />
                                </Grid>
                                <Grid xs={1} alignContent={"center"}>
                                    <Tooltip 
                                        title={
                                            <Typography style={{ whiteSpace: 'normal', display: 'block', maxWidth: '300px' }}>
                                                {t("page.video.choose_language_warning")}
                                            </Typography>
                                        }
                                        variant="soft"
                                        placement="right"
                                        style={{ maxWidth: '300px' }}>
                                        <IconButton variant="plain" color="danger" size="md">
                                            <InfoOutlined style={{ color: 'blue' }} />
                                        </IconButton>
                                    </Tooltip>
                                </Grid>
                            </Grid>
                        </FormControl>
                    )
                }
            </Box >
        </Grid>
    );
};

export default Translation;
