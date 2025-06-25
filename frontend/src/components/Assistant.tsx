import React, { useState } from 'react';
import { Box, List, ListItem, ListItemText, TextField, Paper } from '@mui/material';
import AudioPlayer from 'react-audio-player';
import { Button, Grid} from '@mui/joy';
import { useTranslation } from "react-i18next";
import { ApiPath, RequestMethod, callApi, getAudio } from '../utils/apiUtils';
import { downloadJsonContent } from '../utils/downloadUtils';
import { ApiResponse, QuestionType } from '../utils/apiDataUtils';
import { isApiResponse } from '../utils/validators';
import { LANGUAGE_CODE_MAP, isRTL } from '../utils/languageUtils';
import SendIcon from '@mui/icons-material/Send';

/**
 * Represents a message in the chat.
 * @property id - The unique identifier for the message.
 * @property text - The text content of the message.
 * @property fromUser - Whether the message is from the user or the assistant.
 * @property audio - The audio associated with the message, or null if there is no audio (= message from user).
 * @property language - The language of the message.
 */
export interface Message {
    id: string;
    text: string;
    fromUser: boolean;
    audio: any | null;
    language: string;
}


/**
 * Props for the Assistant component.
 * @property transcriptionJobName - The name of the transcription job.
 * @property selectedLanguage - The currently selected language.
 * @property originalLanguage - The original language of the transcription. 
 * @property showAssistant - Whether to show the assistant component.
 * @property setAlert - A function to set the alert state.
 * @property modelId - The ID of the model to use for the assistant.
 * @property loading - If this feature is loading or not.
 * @property setLoading - A function to set the feature to loading.
 * @property setModelAndTranslation - To disable the model and translation components.
 */
interface AssistantProps {
    transcriptionJobName: string;
    selectedLanguage: string;
    originalLanguage: string;
    showAssistant: boolean;
    setAlert: React.Dispatch<React.SetStateAction<{
        status: "Success" | "Error" | "Warning" | null;
        message: string;
    }>>;
    modelId: string;
    loading: boolean;
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;
    setModelAndTranslation: (state: boolean) => Promise<void>;
}

/**
 * The Assistant component, which renders a chat interface with the ability to send messages to the assistant.
 * @param props - The props for the Assistant component.
 * @returns The rendered Assistant component.
 */
const Assistant: React.FC<AssistantProps> = ({
    transcriptionJobName,
    selectedLanguage,
    originalLanguage,
    showAssistant,
    setAlert,
    modelId,
    loading,
    setLoading,
    setModelAndTranslation
    
}) => {
    const { i18n, t } = useTranslation();
    const rtlUI = isRTL(i18n.resolvedLanguage!);

    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);

    /**
    * Adds a new message to the chat.
    * @param setMessagesFunction - The function to update the messages state.
    * @param message - The text of the message.
    * @param fromUser - Whether the message is from the user or the assistant.
    * @param language - The language of the message.
    * @param audio - The audio associated with the message, or null if there is no audio.
    */
    function addMessage(
        setMessagesFunction: React.Dispatch<React.SetStateAction<Message[]>>,
        message: string,
        fromUser: boolean,
        language: string,
        audio: string | null = null // default to null for user messages
    ) {
        setMessagesFunction((prevMessages: Message[]) => [
            ...prevMessages,
            {
                id: fromUser ? `user${prevMessages.length}` : `bedrock${prevMessages.length + 1}`,
                text: message.trim(),
                fromUser: fromUser,
                audio: audio,
                language: language,
            }
        ]);
    }

    /**
     * Handles the submission of a question to the assistant.
     * @param question - The question to be sent to the assistant.
     * @param setLoadingFunction - The function to update the loading state.
     * @param setInputFunction - The function to update the input state.
     * @param setMessagesFunction - The function to update the messages state.
     */
    const handleSubmit = async (question: string, setLoadingFunction: React.Dispatch<React.SetStateAction<boolean>>, setInputFunction: React.Dispatch<React.SetStateAction<string>>, setMessagesFunction: React.Dispatch<React.SetStateAction<Message[]>>) => {
        setInputFunction('');
        setLoadingFunction(true);
        setModelAndTranslation(true);

        // Add user question to the chat
        addMessage(setMessagesFunction, question, true, selectedLanguage);

        const path = `${ApiPath.Assistant}${transcriptionJobName}`;
        const queryParams = { language: LANGUAGE_CODE_MAP[selectedLanguage] || originalLanguage, modelId: modelId };
        const body: QuestionType = {
            question: question
        }

        try {
            const { value, fileKey, audioFileKey, taskId } = await callApi<ApiResponse>(RequestMethod.POST, path, 10, 2000, isApiResponse, setAlert, queryParams, body);
            var audio: any = null;
            if (audioFileKey || taskId) {
                audio = await getAudio(taskId, audioFileKey, setAlert);
            }
            if (value) {
                addMessage(setMessagesFunction, value, false, selectedLanguage, audio);
                setLoadingFunction(false);
                setModelAndTranslation(false);
                return;
            } else {
                await downloadJsonContent(fileKey, 10, 2000, setAlert).then((answer: string | any) => {
                    if (typeof answer === 'string') {
                        addMessage(setMessagesFunction, answer, false, selectedLanguage, audio);
                        setLoadingFunction(false);
                        setModelAndTranslation(false);
                        return;
                    } else {
                        setAlert({
                            status: "Error",
                            message: 'Assistant response is not of expected format.'
                        });
                        setLoadingFunction(false);
                        setModelAndTranslation(false);
                    }
                });
            }
        } catch (error) {
            console.error('Error asking assistant:', error);
            setLoadingFunction(false);
            setModelAndTranslation(false);
        }
       
    };

    return (
        <Box sx={{ mt: '30px', mb: '30px' }}>
            {showAssistant && (
                <Box dir={rtlUI ? 'rtl' : ''}>
                    {(messages.length > 0) &&
                        <List >
                            {messages.map(message => (
                                <Box key={`${message.id}`}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: message.fromUser ? 'flex-end' : 'flex-start' }}>
                                        {/* Render the audio player for non-user messages */}
                                        {!message.fromUser && message.audio && (
                                            <div style={{ marginBottom: '10px' }}> {/* Adjust margin as needed */}
                                                <AudioPlayer src={message.audio} controls style={{ width: '350px' }} />
                                            </div>
                                        )}
                                        {/* Render the message */}
                                        <Paper
                                            elevation={3}
                                            style={{
                                                borderRadius: 20,
                                                padding: '10px 15px',
                                                marginBottom: 20,
                                                backgroundColor: message.fromUser ? '#0c6ccc' : '#f0f0f0',
                                                color: message.fromUser ? 'white' : 'black',
                                                textAlign: message.fromUser ? 'right' : 'left',
                                                clear: 'both',
                                                maxWidth: '70%',
                                            }}
                                        >
                                            <ListItem sx={{ textAlign: ((isRTL(LANGUAGE_CODE_MAP[message.language])) ? 'right' : 'left') }}>
                                                <ListItemText
                                                    primaryTypographyProps={{ style: { whiteSpace: 'pre-wrap' } }}
                                                    primary={message.text}
                                                />
                                            </ListItem>
                                        </Paper>
                                    </div>
                                </Box>
                            ))}
                        </List>}

                    <Grid container spacing={2} alignItems="flex-end">
                        <Grid xs={10}>
                            <TextField
                                label={t("page.video.type_question")}
                                variant="outlined"
                                fullWidth
                                multiline
                                value={input}
                                inputProps={{ maxLength: 1000 }}
                                onChange={(e) => setInput(e.target.value)}
                            />
                        </Grid>
                        <Grid xs={2}>
                            <Button
                                variant="outlined"
                                color="primary"
                                size="lg"
                                disabled={input.trim() === '' || loading}
                                loading = {loading}
                                loadingPosition= {'end'}
                                endDecorator={!loading && <SendIcon fontSize="small" />}
                                onClick={() => handleSubmit(input, setLoading, setInput, setMessages)}
                                style={{ width: '100%', height: '55px', minWidth: '100px' }}
                            >
                                {t("page.video.send")}
                            </Button>

                        </Grid>
                    </Grid>
                </Box>
            )}
        </Box>
    );
};

export default Assistant;
