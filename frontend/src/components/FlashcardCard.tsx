
import React, { useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/joy/Typography';
import Button from '@mui/joy/Button';
import { useTranslation } from "react-i18next";
import { Flashcard } from '../utils/apiDataUtils';

/**
 * The FlashcardCard component, which renders a single flashcard.
 * @param props - The props for the FlashcardCard component, which are the same as the Flashcard interface.
 * @returns The rendered FlashcardCard component.
 */
const FlashcardCard: React.FC<Flashcard> = ({ question, answer }) => {
  const { t } = useTranslation();
  const [showAnswer, setShowAnswer] = useState(false);
  const [buttonText, setButtonText] = useState(t("page.video.show_answer"));

   /**
   * Toggles the visibility of the flashcard answer.
   * Updates the button text based on the current state.
   */
  const handleToggleAnswer = () => {
    setShowAnswer(!showAnswer);
    showAnswer ? setButtonText(t("page.video.show_answer")) : setButtonText(t("page.video.hide_answer"));
  };

  return (
    <Card>
      <CardContent>
        <Typography level="h4" gutterBottom>{t("page.video.question")}</Typography>
        <Typography level="body-md">{question}</Typography>
        <Typography level="h4" gutterBottom style={{ marginTop: '10px' }}>{t("page.video.answer")}</Typography>
        <Typography level="body-md" textColor={showAnswer ? 'primary' : 'transparent'}>{answer}</Typography>
        <Button variant={showAnswer ? "solid" : "outlined"} color="primary" onClick={handleToggleAnswer} style={{ marginTop: '10px' }}>{buttonText}</Button>
      </CardContent>
    </Card>

  );
};

export default FlashcardCard;
