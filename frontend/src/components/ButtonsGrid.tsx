import React from 'react';
import { Box, Button, Grid} from '@mui/joy';
import Translation from './Translation';
import { useTranslation } from 'react-i18next';
import { isRTL } from '../utils/languageUtils';
import { FlashcardsResponse } from '../utils/apiDataUtils';
import { TextSnippet } from '@mui/icons-material';
import ModelSelector from './ModelSelector';
import DoneIcon from '@mui/icons-material/Done';
import ChatIcon from '@mui/icons-material/Chat';

/**
 * Props for the ButtonsGrid component.
 * @property transcriptionJobName - The name of the transcription job.
 * @property showTranscription - Whether to show the transcription content.
 * @property showSummary - Whether to show the summary content.
 * @property showFlashcards - Whether to show the flashcards content.
 * @property showAssistant - Whether to show the assistant component.
 * @property loadTranscription - Whether the transcription content is still loading.
 * @property loadSummary - Whether the summary content is still loading.
 * @property loadFlashcards - Whether the flashcards content is still loading.
 * @property transcriptionContent - The content of the transcription.
 * @property summaryContent - The content of the summary.
 * @property flashcardsContent - The content of the flashcards.
 * @property originalLanguage - The original language of the content.
 * @property selectedLanguage - The currently selected language.
 * @property languages - The list of available languages.
 * @property loadTranslation - Wether to set the translation to loading or not.
 * @property handleTranslateSelected - A function to handle the selection of a language for translation.
 * @property setSelectedLanguage - A function to set the selected language.
 * @property setPreviousLanguage - To set the previous selected language for translation.
 * @property handleShowTranscript - A function to handle the display of the transcription content.
 * @property handleShowSummary - A function to handle the display of the summary content.
 * @property handleShowFlashcards - A function to handle the display of the flashcards content.
 * @property handleShowAssistant - A function to handle the display of the assistant component.
 * @property selectedModelId - The ID of the model to use.
 * @property loadModel - If the model is loading or not.
 * @property handleChooseModel - A function to handle the display of the assistant component.
 * @property setSelectedModelId - A function to handle the display of the assistant component.
 * @property setAlert - A function to set the alert state.
 */
interface ButtonsGridProps {
  transcriptionJobName: string;
  showTranscription: boolean;
  showSummary: boolean;
  showFlashcards: boolean;
  showAssistant: boolean;
  loadTranscription: boolean;
  loadSummary: boolean;
  loadFlashcards: boolean;
  transcriptionContent: string;
  summaryContent: string;
  flashcardsContent: FlashcardsResponse;
  originalLanguage: string;
  selectedLanguage: string;
  languages: string[];
  loadTranslation: boolean;
  handleTranslateSelected: (previousLanguage: string, selectedLanguage: string) => void;
  setSelectedLanguage: React.Dispatch<React.SetStateAction<string | null>>;
  setPreviousLanguage: React.Dispatch<React.SetStateAction<string | null>>;
  handleShowTranscript: () => void;
  handleShowSummary: () => Promise<void>;
  handleShowFlashcards: () => Promise<void>;
  handleShowAssistant: () => void;
  selectedModelId: string;
  loadModel: boolean;
  handleChooseModel: (previousModelId: string, selectedModelId: string) => Promise<void>
  setSelectedModelId: React.Dispatch<React.SetStateAction<string>>;
  setAlert: React.Dispatch<React.SetStateAction<{
    status: "Success" | "Error" | "Warning" | null;
    message: string;
  }>>;
}

/**
 * The ButtonsGrid component, which renders a grid of buttons for displaying
 * the transcription, summary, flashcards, and assistant.
 * @param props - The props for the ButtonsGrid component.
 * @returns The rendered ButtonsGrid component.
 */
const ButtonsGrid: React.FC<ButtonsGridProps> = ({
  transcriptionJobName,
  showTranscription,
  showSummary,
  showFlashcards,
  showAssistant,
  loadTranscription,
  loadSummary,
  loadFlashcards,
  transcriptionContent,
  summaryContent,
  flashcardsContent,
  originalLanguage,
  selectedLanguage,
  languages,
  loadTranslation,
  handleTranslateSelected,
  setSelectedLanguage,
  setPreviousLanguage,
  handleShowTranscript,
  handleShowSummary,
  handleShowFlashcards,
  handleShowAssistant,
  selectedModelId,
  loadModel,
  handleChooseModel,
  setSelectedModelId,
  setAlert
}) => {
  const { t, i18n } = useTranslation();
  const rtl = isRTL(i18n.resolvedLanguage!);
  return (
    (transcriptionJobName && originalLanguage) ? (
      <Box>
        <Box sx={{ mt: '30px', mb: '10px' }} dir={rtl ? 'rtl' : ''}>
          <Grid container spacing={2} >
            {/* Render Transcription Button */}
            <Grid xs>
              <Button
                variant={showTranscription ? "solid" : "outlined"}
                color="primary"
                size="lg"
                loadingPosition={'end'}
                endDecorator={<DoneIcon />}
                style={{
                  height: '55px',
                  width: '100%',
                  boxSizing: 'border-box', // Ensure padding and borders are included in the width
                }}
                onClick={() => handleShowTranscript()}
              >
                {t("page.video.transcript")}
              </Button>
            </Grid>
            {/* Render Summary Button */}
            <Grid xs>
              <Button
                variant={showSummary ? "solid" : "outlined"}
                color="primary"
                size="lg"
                loading={!summaryContent && loadSummary}
                loadingPosition={'end'}
                endDecorator={summaryContent && <DoneIcon />}
                style={{
                  height: '55px',
                  width: '100%',
                  boxSizing: 'border-box', // Ensure padding and borders are included in the width
                }}
                onClick={() => handleShowSummary()}
              >
                {t("page.video.summary")}
              </Button>
            </Grid>

            {/* Render Flashcards Button */}
            <Grid xs>
              <Button
                variant={showFlashcards ? "solid" : "outlined"}
                color="primary"
                size="lg"
                loading={!flashcardsContent && loadFlashcards}
                loadingPosition={'end'}
                endDecorator={flashcardsContent && <DoneIcon />}
                style={{
                  height: '55px',
                  width: '100%',
                  boxSizing: 'border-box', // Ensure padding and borders are included in the width
                }}
                onClick={() => handleShowFlashcards()}
              >
                {t("page.video.flashcards")}
              </Button>
            </Grid>

            {/* Render Assistant Button */}
            <Grid xs>
              <Button
                variant={showAssistant ? "solid" : "outlined"}
                color="primary"
                size="lg"
                endDecorator={<ChatIcon />}
                style={{
                  height: '55px',
                  width: '100%',
                  boxSizing: 'border-box', // Ensure padding and borders are included in the width
                }}
                onClick={() => handleShowAssistant()}
              >
                {t("page.video.assistant")}
              </Button>
            </Grid>
          </Grid>
        </Box>
        <Box sx={{ mb: '30px' }} dir={rtl ? 'rtl' : ''}>
          <Grid container spacing={2} >
            {/* Render Translation Component */}
            <ModelSelector
              selectedModelId={selectedModelId}
              loading={loadModel}
              handleChooseModel={handleChooseModel}
              setSelectedModelId={setSelectedModelId}
              setAlert={setAlert}
            />
            <Translation
              transcriptionJobName={transcriptionJobName}
              originalLanguage={originalLanguage}
              selectedLanguage={selectedLanguage}
              languages={languages}
              loading={loadTranslation}
              handleTranslateSelected={handleTranslateSelected}
              setSelectedLanguage={setSelectedLanguage}
              setPreviousLanguage={setPreviousLanguage}
            />
          </Grid>
        </Box>
      </Box>
     ) : (
      <Box sx={{ mt: '30px', mb: '30px' }} dir={rtl ? 'rtl' : ''}>  
      <Button
        variant={showTranscription ? "solid" : "outlined"}
        color="primary"
        size="lg"
        loading={!transcriptionContent && loadTranscription}
        loadingPosition={'end'}
        style={{
          height: '55px',
          width: '20%',
          minWidth: '250px', // Ensure minimum width is respected
          boxSizing: 'border-box', // Ensure padding and borders are included in the width
        }}
        endDecorator={<TextSnippet />}
        onClick={() => handleShowTranscript()}
      >
        {t("page.upload.get_transcript")}
      </Button>
      </Box>
    )
  )
};

export default ButtonsGrid;
