
import React from 'react';
import AudioPlayer from 'react-audio-player';
import FlashcardCard from './FlashcardCard';
import { Box, Grid } from '@mui/joy';
import { FlashcardsResponse } from '../utils/apiDataUtils';

/**
 * Props for the Flashcards component.
 * @property flashcards - The content of the flashcards, or null if not yet loaded.
 * @property translatedFlashcards - The translated content of the flashcards, or null if not yet translated.
 * @property originalLanguage - The original language of the flashcards, or null if not set.
 * @property selectedLanguage - The currently selected language.
 * @property flashcardsAudio - The audio for the flashcards, or null if not available.
 * @property translatedFlashcardsAudio - The audio for the translated flashcards, or null if not available.
 * @property showFlashcards - Whether to show the flashcards panel.
 */
interface FlashcardsProps {
  flashcards: FlashcardsResponse | null;
  translatedFlashcards: FlashcardsResponse | null;
  originalLanguage: string | null;
  selectedLanguage: string;
  flashcardsAudio: string | null;
  translatedFlashcardsAudio: string | null;
  showFlashcards: boolean;
}

/**
 * The Flashcards component, which renders the flashcards content and, if available, the translated flashcards.
 * @param props - The props for the Flashcards component.
 * @returns The rendered Flashcards component.
 */
const Flashcards: React.FC<FlashcardsProps> = ({
  flashcards: flashcardsContent,
  translatedFlashcards,
  originalLanguage,
  selectedLanguage,
  flashcardsAudio,
  translatedFlashcardsAudio,
  showFlashcards,
}) => {

  return (
    <Box sx={{ mt: '30px', mb: '30px' }}>
      {showFlashcards && (
        <Grid container spacing={2}>
          {/* Original text column */}
          {showFlashcards && <Grid xs={12} md={originalLanguage !== selectedLanguage && translatedFlashcards ? 6 : 12}>
            {(flashcardsAudio || translatedFlashcardsAudio) && (
              <Box sx={{ height: '80px' }} >
                {flashcardsAudio &&
                  <AudioPlayer src={flashcardsAudio} controls />
                }
              </Box>
            )}
            {flashcardsContent && (
              flashcardsContent.flashcards.map((flashcard, index) => (
                <FlashcardCard key={index} question={flashcard.question} answer={flashcard.answer} />
              ))
            )}
          </Grid>
          }
          {/* Translation column (if available) */}
          {showFlashcards && translatedFlashcards && originalLanguage !== selectedLanguage && (
            <Grid xs={12} md={6}>
              {(flashcardsAudio || translatedFlashcardsAudio) && (
                <Box sx={{ height: '80px' }} >
                  {translatedFlashcardsAudio &&
                    <AudioPlayer src={translatedFlashcardsAudio} controls />
                  }
                </Box>
              )}
              {translatedFlashcards && (
                translatedFlashcards.flashcards.map((flashcard, index) => (
                  <FlashcardCard key={index} question={flashcard.question} answer={flashcard.answer} />
                ))
              )}
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
};

export default Flashcards;
