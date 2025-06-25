import React, { useState } from 'react';
import ButtonsGrid from './ButtonsGrid';
import Transcription from './Transcription';
import Summary from './Summary';
import Flashcards from './Flashcards';
import Assistant from './Assistant';
import Divider from '@mui/joy/Divider';
import { ApiResponse, FlashcardsResponse, GetTranscriptionApiResponse, StartTranscriptionApiRequest, StartTranscriptionApiResponse, TranscriptionS3Response } from '../utils/apiDataUtils';
import { ApiPath, RequestMethod, callApi, getAudio } from '../utils/apiUtils';
import { isApiResponse, isFlashcardArray, isGetTranscriptionApiResponse, isStartTranscriptionApiResponse, isTranscriptionS3Response } from '../utils/validators';
import { downloadJsonContent } from '../utils/downloadUtils';
import { AVAILABLE_LANGUAGES, LANGUAGE_CODE_MAP, LANGUAGE_NAME_MAP, isAvailable } from '../utils/languageUtils';
import awsExports from '../../aws-exports';

/**
 * Props for the Controller component.
 * @property videoFileKey - The key of the video file.
 * @property setAlert - A function to set the alert state.
 */
interface ControllerProps {
  videoFileKey: string;
  setAlert: React.Dispatch<React.SetStateAction<{
    status: "Success" | "Error" | "Warning" | null;
    message: string;
  }>>;
}

/**
 * The response from the controller functions.
 * @property fileKey - The file key, if the operation was successful.
 * @property error - The error message, if the operation failed.
 */
export interface ControllerResponse {
  fileKey?: string;
  error?: string;
}

/**
 * The Controller component, which manages the state and logic for the
 * transcription, summary, flashcards, and assistant features.
 * @param props - The props for the Controller component.
 * @returns The rendered Controller component.
 */
const Controller: React.FC<ControllerProps> = ({ videoFileKey, setAlert }) => {

  const [transcriptionJobName, setTranscriptionJobName] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [translatedTranscription, setTranslatedTranscription] = useState<string | null>(null);
  const [translatedTranscriptionAudio, setTranslatedTranscriptionAudio] = useState<any | null>(null);
  const [showTranscription, setShowTranscription] = useState(false);
  const [loadTranscription, setLoadTranscription] = useState(false);

  const [summary, setSummary] = useState<string | null>(null);
  const [summaryAudio, setSummaryAudio] = useState<any | null>(null);
  const [translatedSummary, setTranslatedSummary] = useState<string | null>(null);
  const [translatedSummaryAudio, setTranslatedSummaryAudio] = useState<any | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [loadSummary, setLoadSummary] = useState(false);

  const [flashcards, setFlashcards] = useState<FlashcardsResponse | null>(null);
  const [flashcardsAudio, setFlashcardsAudio] = useState<any | null>(null);
  const [translatedFlashcards, setTranslatedFlashcards] = useState<FlashcardsResponse | null>(null);
  const [translatedFlashcardsAudio, setTranslatedFlashcardsAudio] = useState<any | null>(null);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [loadFlashcards, setLoadFlashcards] = useState(false);

  const [showAssistant, setShowAssistant] = useState(false);
  const [loadAssistant, setLoadAssistant] = useState(false);

  const [previousLanguage, setPreviousLanguage] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [originalLanguage, setOriginalLanguage] = useState<string | null>(null);
  const [languages, setLanguages] = useState(AVAILABLE_LANGUAGES);
  const [loadTranslation, setLoadTranslation] = useState(false);

  const [selectedModelId, setSelectedModelId] = useState<string>(import.meta.env.VITE_BEDROCK_MODEL_ID || awsExports.bedrockModelId);
  const [loadModel, setLoadModel] = useState(false);

  /**
   * Toggles the visibility of a panel and optionally hides the others.
   * @param targetState - The current state of the target panel.
   * @param setShowState - The function to update the state of the target panel.
   * @param hideOthers - Whether to hide the other panels (default is true).
   */
  const handleTogglePanel = (
    targetState: boolean,
    setShowState: React.Dispatch<React.SetStateAction<boolean>>,
    hideOthers: boolean = true
  ) => {
    // Update state
    setShowState(!targetState);

    // Hide others
    if (hideOthers) {
      if (showAssistant) handleTogglePanel(showAssistant, setShowAssistant, false);
      if (showFlashcards) handleTogglePanel(showFlashcards, setShowFlashcards, false);
      if (showSummary) handleTogglePanel(showSummary, setShowSummary, false);
      if (showTranscription) handleTogglePanel(showTranscription, setShowTranscription, false);
    }
  };

  /**
   * Checks if any of the panels are currently being shown.
   * @returns True if any panel is being shown, false otherwise.
   */
  const showingPanels = () => {
    return showTranscription || showSummary || showFlashcards || showAssistant;
  }

  /**
* Determines whether a text should be translated based on the selected languages and availability of the transcript.
*
* This function checks if there is a transcription job name, an original language, and a selected language.
* It also verifies that the selected language is different from both the original language and the previous language.
* If its not different from the previous language, it also checks if the selected model is different from the previous model.
*
* @param {string} transcriptionJobName - The name of the transcription job.
* @param {string} selectedLanguage - The language selected for translation.
* @returns {boolean} - Returns true if the translation API should be called, otherwise false.
*/
  const shouldTranslate = (transcriptionJobName: string | null, previousLanguage: string, selectedLanguage: string): boolean => {
    if (
      transcriptionJobName &&
      originalLanguage &&
      selectedLanguage !== originalLanguage &&
      (selectedLanguage !== previousLanguage)
    ) {
      return true;
    }
    return false;
  };

  /**
* Determines whether a new text should be produces based on the selected model and availability of the transcript.
*
* This function checks if there is a transcription job name and a selected model.
* It also verifies that the selected model is different from the previous model.
*
* @param {string} transcriptionJobName - The name of the transcription job.
* @param {string} previousModelId - The previous model selected.
* @param {string} selectedModelId - The language selected for translation.
* @returns {boolean} - Returns true if the translation API should be called, otherwise false.
*/
  const shouldChangeModel = (transcriptionJobName: string | null, previousModelId: string, selectedModelId: string): boolean => {
    if (
      transcriptionJobName &&
      selectedModelId &&
      selectedLanguage &&
      previousModelId &&
      selectedModelId !== previousModelId
    ) {
      return true;
    }
    return false;
  };


  /**
   * Handles the selection of a language for translation.
   * @param previousLanguage - The previous language.
   * @param selectedLanguage - The selected language.
   */
  const handleTranslateSelected = async (previousLanguage: string, selectedLanguage: string) => {
    if (shouldTranslate(transcriptionJobName, previousLanguage, selectedLanguage)) {
      setModelAndTranslation(true);
      if (transcription) {
        await getTranslation(transcriptionJobName!, ApiPath.Transcriptions, originalLanguage!, selectedLanguage!, setTranslatedTranscription, setTranslatedTranscriptionAudio);
      }
      if (summary) {
        await getTranslation(transcriptionJobName!, ApiPath.Summaries, originalLanguage!, selectedLanguage!, setTranslatedSummary, setTranslatedSummaryAudio);
      }
      if (flashcards) {
        await getFlashcards(transcriptionJobName!, selectedLanguage!, setTranslatedFlashcards, setTranslatedFlashcardsAudio);
      }
      setModelAndTranslation(false);
    }
  }
  /**
  * Handles choosing a new model.
  * @param previousModelId - The previous model id.
  * @param selectedModelId - The selected model id.
  */
  const handleChooseModel = async (previousModelId: string, selectedModelId: string) => {
    if (shouldChangeModel(transcriptionJobName, previousModelId, selectedModelId)) {
      resetController();
      setShowTranscription(true);
    }
  }

  /**
  * Sets the state of translation drop down to loading when a functionality is loading.
  * It sets it to false if another functionality is not loading.
  * @param state the value to set the loading if another component is not loading.
  */
  const setModelAndTranslation = async (state: boolean) => {
    if (state) {
      setLoadModel(true);
      setLoadTranslation(true);
    } else {
      setTimeout(() => {
        if (!loadFlashcards && !loadSummary && !loadAssistant) {
          setLoadModel(false);
          setLoadTranslation(false);
        }
      }, 0);
    }
  }

  /**
   * Resets the controller state variables except for the transcription, its translation and its audios.
   */
  const resetController = async () => {
    setTimeout(() => {
      setSummary(null);
      setSummaryAudio(null);
      setTranslatedSummary(null);
      setTranslatedSummaryAudio(null);
      setShowSummary(false);
      setLoadSummary(false);

      setFlashcards(null);
      setFlashcardsAudio(null);
      setTranslatedFlashcards(null);
      setTranslatedFlashcardsAudio(null);
      setShowFlashcards(false);
      setLoadFlashcards(false);

      setShowAssistant(false);
      setLoadTranslation(false);
      setLoadModel(false);
    }, 0);

  }

  /**
     * Handles the display of the transcription panel.
     */
  const handleShowTranscription = async () => {
    if (transcription == null) {
      setLoadTranscription(true);
      setLoadTranslation(true);
      const { fileKey, error } = await startTranscription();
      if (fileKey) {
        setLoadTranscription(false);
        if (!showingPanels()) {
          handleTogglePanel(showTranscription, setShowTranscription);
        }
        if (shouldTranslate(transcriptionJobName, previousLanguage!, selectedLanguage!) && transcription) {
          await getTranslation(transcriptionJobName!, ApiPath.Transcriptions, originalLanguage!, selectedLanguage!, setTranslatedTranscription, setTranslatedTranscriptionAudio);
        }
        setLoadTranslation(false);
      } else if (error) {
        setLoadTranscription(false);
        setLoadTranslation(false);
      }
    } else {
      handleTogglePanel(showTranscription, setShowTranscription);
    }
  };

  /**
 * Handles the display of the summary panel.
 */
  const handleShowSummary = async () => {
    if (transcriptionJobName && originalLanguage) {
      if (summary == null) {
        setLoadSummary(true);
        setModelAndTranslation(true);
        const { fileKey, error } = await getSummary(transcriptionJobName, originalLanguage, setSummary, setSummaryAudio);
        if (fileKey) {
          setLoadSummary(false);
          if (shouldTranslate(transcriptionJobName, previousLanguage!, selectedLanguage!) && transcription) {
            await getTranslation(transcriptionJobName!, ApiPath.Summaries, originalLanguage!, selectedLanguage!, setTranslatedSummary, setTranslatedSummaryAudio);
          }
          setModelAndTranslation(false);
          if (!showingPanels()) {
            handleTogglePanel(showSummary, setShowSummary);
          }
        } else if (error) {
          setLoadSummary(false);
          setModelAndTranslation(false);
        }
      } else {
        handleTogglePanel(showSummary, setShowSummary);
      }
    } else {
      setAlert({
        status: "Warning",
        message: "Heads up! The transcription is not ready yet."
      });
    }
  };

  /**
 * Handles the display of the flashcards panel.
 */
  const handleShowFlashcards = async () => {
    if (transcriptionJobName && originalLanguage) {
      if (flashcards == null) {
        setLoadFlashcards(true);
        setModelAndTranslation(true);
        const { fileKey, error } = await getFlashcards(transcriptionJobName, originalLanguage, setFlashcards, setFlashcardsAudio);
        if (fileKey) {
          setLoadFlashcards(false);
          if (shouldTranslate(transcriptionJobName, previousLanguage!, selectedLanguage!) && transcription) {
            await getFlashcards(transcriptionJobName!, selectedLanguage!, setTranslatedFlashcards, setTranslatedFlashcardsAudio);
          }
          setModelAndTranslation(false);
          if (!showingPanels()) {
            handleTogglePanel(showFlashcards, setShowFlashcards);
          }
        } else if (error) {
          setLoadFlashcards(false);
          setModelAndTranslation(false);
        }

      } else {
        handleTogglePanel(showFlashcards, setShowFlashcards);
      }
    } else {
      setAlert({
        status: "Warning",
        message: "Heads up! The transcription is not ready yet."
      });
    }
  };

  /**
 * Handles the display of the assistant panel.
 */
  const handleShowAssistant = () => {
    if (transcriptionJobName && selectedLanguage) {
      handleTogglePanel(showAssistant, setShowAssistant);
    } else {
      setAlert({
        status: "Warning",
        message: "Heads up! The transcription is not ready yet."
      });
    }
  }

  /**
   * Starts the transcription process for the video file by making a POST request to the "transcriptions" endpoint.
   * This function triggers the Amazon Transcribe service to start transcribing the video file identified by the `videoFileKey`.
   * It then retrieves the transcription job name and waits for a short period before calling the `getTranscription` function
   * to fetch the transcription content.
   * @returns A ControllerResponse object with the file key or an error message.
   */
  const startTranscription = async (): Promise<ControllerResponse> => {
    const path = ApiPath.Transcriptions;
    const body: StartTranscriptionApiRequest = {
      fileKey: videoFileKey
    }
    try {
      const response = await callApi<StartTranscriptionApiResponse>(RequestMethod.POST, path, 5, 10000, isStartTranscriptionApiResponse, setAlert, undefined, body);
      await new Promise(resolve => setTimeout(resolve, 10000));
      setTranscriptionJobName(response.transcriptionJobName);
      return await getTranscription(response.transcriptionJobName);
    } catch (error) {
      console.error('Error checking transcription job status:', error);
      return { error: 'Error starting your transcription' };
    }
  }

  /**
   * Retrieves the transcription content from AWS Services.
   * This function makes a GET request to the "transcriptions/{transcriptionJobName}" endpoint to fetch the transcription
   * for the specified job name. It then downloads the JSON content from the S3 bucket and sets the transcription content,
   * original language, and selected language in the component state.
   * @param transcriptionJobName - The name of the transcription job.
   * @returns A ControllerResponse object with the file key or an error message.
   */
  const getTranscription = async (transcriptionJobName: string): Promise<ControllerResponse> => {
    const path = `${ApiPath.Transcriptions}${transcriptionJobName}`;
    try {
      const { language, fileKey } = await callApi<GetTranscriptionApiResponse>(RequestMethod.GET, path, 60, 10000, isGetTranscriptionApiResponse, setAlert);

      await downloadJsonContent(fileKey, 10, 2000, setAlert).then((jsonData: TranscriptionS3Response | any) => {
        if (isTranscriptionS3Response(jsonData)) {
          const transcription = jsonData.results.transcripts[0].transcript;
          setTranscription(transcription);

          if (!isAvailable(language)) {
            // If not present, append it to the array
            let tempLanguages = [...languages, language];
            setLanguages(tempLanguages);
          }
          setOriginalLanguage(LANGUAGE_NAME_MAP[language]);
          setSelectedLanguage(LANGUAGE_NAME_MAP[language]);
        } else {
          throw new Error("Transcription is not of expected format");
        }
      });
      return { fileKey: fileKey };
    } catch (error) {
      console.error('Error checking transcription job status:', error);
      return { error: 'Error getting your transcription.' };
    }
  };

  /**
 * Retrieves the summary content from AWS Services.
 * This function makes a GET request to the "summaries/{transcriptionJobName}" endpoint to fetch the summary
 * for the specified transcription job name and language. If the response contains a value, it sets the
 * summary content directly. Otherwise, it downloads the JSON content from the S3 bucket and sets the
 * summary content.
 * @param transcriptionJobName - The name of the transcription job.
 * @param language - The language of the summary.
 * @returns A ControllerResponse object with the file key or an error message.
 */
  const getSummary = async (transcriptionJobName: string, language: string, setText: React.Dispatch<React.SetStateAction<any>>, setAudio: React.Dispatch<React.SetStateAction<any>>,): Promise<ControllerResponse> => {
    if (!language) {
      throw Error('Language was not set, cannot get summary');
    }
    const path = `${ApiPath.Summaries}${transcriptionJobName}`;
    const queryParams = { language: LANGUAGE_CODE_MAP[language] || originalLanguage, modelId: selectedModelId };
    try {
      const { value, fileKey, audioFileKey, taskId } = await callApi<ApiResponse>(RequestMethod.GET, path, 10, 2000, isApiResponse, setAlert, queryParams);
      if (value) {
        setText(value);
      } else {
        await downloadJsonContent(fileKey, 10, 2000, setAlert).then((summary: string | any) => {
          if (typeof summary === 'string') {
            setText(summary);
          } else {
            console.error("Error getting summary content from S3 Bucket");
          }
        });
      }
      getAudio(taskId, audioFileKey, setAlert).then(audio => {
        setAudio(audio);
      });
      return { fileKey: fileKey };
    } catch (error) {
      console.error('Error getting summary:', error);
      return { error: 'Error getting your summary.' };
    }
  };

  /**
 * Retrieves the flashcards content from AWS Services.
 * This function makes a GET request to the "flashcards/{transcriptionJobName}" endpoint to fetch the flashcards
 * for the specified transcription job name and language. If the response contains a value, it parses the
 * flashcards data and sets the flashcards content. Otherwise, it downloads the JSON content from the S3 bucket
 * and sets the flashcards content.
 * @param transcriptionJobName - The name of the transcription job.
 * @param language - The language of the flashcards.
 * @param setText - A function to set the flashcards content.
 * @param setAudio - A function to set the flashcards content audio.
 * @returns A ControllerResponse object with the file key or an error message.
 */
  const getFlashcards = async (transcriptionJobName: string, language: string, setText: React.Dispatch<React.SetStateAction<any>>, setAudio: React.Dispatch<React.SetStateAction<any>>,): Promise<ControllerResponse> => {
    if (!language) {
      throw Error('Language was not set, cannot get flashcards');
    }
    const path = `${ApiPath.Flashcards}${transcriptionJobName}`;
    const queryParams = { language: LANGUAGE_CODE_MAP[language] || originalLanguage, modelId: selectedModelId };
    try {
      const { value, fileKey, audioFileKey, taskId } = await callApi<ApiResponse>(RequestMethod.GET, path, 10, 2000, isApiResponse, setAlert, queryParams);
      try {
        const flashcards = { flashcards: JSON.parse(value!) };
        if (value && isFlashcardArray(flashcards)) {
          setText(flashcards);
        } else {
          await downloadJsonContent(fileKey, 10, 2000, setAlert).then((flashcardsContent: FlashcardsResponse | any) => {
            const flashcards = { flashcards: JSON.parse(flashcardsContent!) };
            if (isFlashcardArray(flashcards)) {
              setText(flashcards);
            } else {
              setAlert({
                status: "Error",
                message: "The model response could not be processed. It seems that the flashcards were not formatted correctly. Please try again or use a different model."
              });
              return { error: 'Error getting your flashcards.' };
            }
          });

        }
        getAudio(taskId, audioFileKey, setAlert).then(audio => {
          setAudio(audio);
        });
        return { fileKey: fileKey };
      } catch (error) {
        setAlert({
          status: "Error",
          message: "The model response could not be processed. It seems that the flashcards were not formatted correctly. Please try again or use a different model."
        });
        console.error('Error getting flashcards:', error);
        return { error: 'Error getting your flashcards.' };
      }
    } catch (error) {
      console.error('Error getting flashcards:', error);
      return { error: 'Error getting your flashcards.' };
    }
  }

  /**
   * Retrieves the translation content from AWS services.
   * This function makes a GET request to the "translations/{transcriptionJobName}" endpoint to fetch the translation
   * for the specified transcription job name, resource path, source language, and destination language. 
   * If the source and destination languages are the same, nothing is done, so it sets the text and audio to null. 
   * Otherwise, it checks if the response contains the translated value and sets the text accordingly. 
   * If not, it downloads the JSON content from the S3 bucket and sets the text. 
   * If the response contains an audioFileKey, it downloads the audio from the S3 bucket and sets the audio.
   * @param transcriptionJobName - The name of the transcription job.
   * @param resourcePath - The path to the resource to be translated (e.g. /summaries).
   * @param source_language - The source language of the content.
   * @param destination_language - The destination language for the translation.
   * @param setText - A function to set the translated text.
   * @param setAudio - A function to set the translated audio.
   */
  const getTranslation = async (transcriptionJobName: string, resourcePath: string, source_language: string, destination_language: string, setText: React.Dispatch<React.SetStateAction<any>>, setAudio: React.Dispatch<React.SetStateAction<any>>) => {
    const path = `${ApiPath.Translations}${transcriptionJobName}`;
    const queryParams = { resource_path: resourcePath, source_language: LANGUAGE_CODE_MAP[source_language] || originalLanguage, destination_language: LANGUAGE_CODE_MAP[destination_language] || originalLanguage };
    try {
      const { value, fileKey, audioFileKey, taskId } = await callApi<ApiResponse>(RequestMethod.GET, path, 10, 2000, isApiResponse, setAlert, queryParams);
      if (value) {
        setText(value);
      } else {
        await downloadJsonContent(fileKey!, 10, 2000, setAlert).then((translation: string | any) => {
          if (typeof translation === 'string') {
            setText(translation);
          } else {
            console.error("Error getting content from S3 Bucket");
          }
        });
      }
      
      getAudio(taskId, audioFileKey, setAlert).then(audio => {
        setAudio(audio);
      });
    } catch (error) {
      console.error('Error getting translation:', error);
    }
  }

  return (
    <>
      {/* Render ButtonsGrid */}
      <ButtonsGrid
        transcriptionJobName={transcriptionJobName!}
        showTranscription={showTranscription}
        showSummary={showSummary}
        showFlashcards={showFlashcards}
        showAssistant={showAssistant}
        loadTranscription={loadTranscription}
        loadSummary={loadSummary}
        loadFlashcards={loadFlashcards}
        transcriptionContent={transcription!}
        summaryContent={summary!}
        flashcardsContent={flashcards!}
        originalLanguage={originalLanguage!}
        selectedLanguage={selectedLanguage!}
        languages={languages}
        loadTranslation={loadTranslation}
        handleTranslateSelected={handleTranslateSelected}
        setSelectedLanguage={setSelectedLanguage}
        setPreviousLanguage={setPreviousLanguage}
        handleShowTranscript={handleShowTranscription}
        handleShowSummary={handleShowSummary}
        handleShowFlashcards={handleShowFlashcards}
        handleShowAssistant={handleShowAssistant}
        selectedModelId={selectedModelId}
        loadModel={loadModel}
        handleChooseModel={handleChooseModel}
        setSelectedModelId={setSelectedModelId}
        setAlert={setAlert}
      />

      {showingPanels() && <Divider />}

      {/* Render Transcription */}
      <Transcription
        originalTranscription={transcription!}
        translatedTranscription={translatedTranscription}
        translatedAudio={translatedTranscriptionAudio}
        originalLanguage={originalLanguage}
        selectedLanguage={selectedLanguage}
        showTranscript={showTranscription}
      />

      {/* Render Summary */}
      <Summary
        originalSummary={summary!}
        translatedSummary={translatedSummary}
        originalLanguage={originalLanguage}
        selectedLanguage={selectedLanguage}
        summaryAudio={summaryAudio}
        translatedSummaryAudio={translatedSummaryAudio}
        showSummary={showSummary}
      />

      {/* Render Flashcards */}
      <Flashcards
        flashcards={flashcards}
        translatedFlashcards={translatedFlashcards}
        originalLanguage={originalLanguage}
        selectedLanguage={selectedLanguage!}
        flashcardsAudio={flashcardsAudio}
        translatedFlashcardsAudio={translatedFlashcardsAudio}
        showFlashcards={showFlashcards}
      />

      {/* Render Assistant */}
      <Assistant
        transcriptionJobName={transcriptionJobName!}
        selectedLanguage={selectedLanguage!}
        originalLanguage={originalLanguage!}
        showAssistant={showAssistant}
        setAlert={setAlert}
        modelId={selectedModelId}
        setModelAndTranslation={setModelAndTranslation}
        loading={loadAssistant}
        setLoading={setLoadAssistant}
      />
    </>
  );
};

export default Controller;

