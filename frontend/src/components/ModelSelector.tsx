
import React, { useEffect, useState } from 'react';
import { Autocomplete, Box, CircularProgress, FormControl, FormLabel, IconButton, Tooltip, Typography, Grid } from '@mui/joy';
import { ApiPath, RequestMethod, callApi } from '../utils/apiUtils';
import { GetModelsApiResponse, ModelMap } from '../utils/apiDataUtils';
import { isGetModelsApiResponse } from '../utils/validators';
import { useTranslation } from 'react-i18next';
import InfoOutlined from '@mui/icons-material/InfoOutlined';

/**
 * The response from the controller functions.
 * @property error - The error message, if the operation failed.
 */
export interface ModelsResponse {
  modelMap?: ModelMap;
  error?: string;
}

interface ModelSelectorProps {
  selectedModelId: string;
  loading: boolean;
  handleChooseModel: (previousModelId: string, selectedModelId: string) => Promise<void>;
  setSelectedModelId: React.Dispatch<React.SetStateAction<string>>;
  setAlert: React.Dispatch<React.SetStateAction<{
    status: "Success" | "Error" | "Warning" | null;
    message: string;
  }>>;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModelId,
  loading,
  handleChooseModel,
  setSelectedModelId,
  setAlert
}) => {

  const { t } = useTranslation();
  const [modelMap, setModelMap] = useState<ModelMap>();
  const [modelName, setModelName] = useState<string>("Anthropic Claude 3 Sonnet v1:0");

  useEffect(() => {
    // Call the lambda function to list the foundation models
    getModels();
  }, []); // The empty dependency array means this effect runs once when the component mounts.

/**
* Retrieves the map of available foundation models so that one can be selected.
* This function makes a GET request to the "modes/" endpoint to fetch the map of available models.
*/
  const getModels = async (): Promise<void> => {
    const path = `${ApiPath.Models}`;
    try {
      const response = await callApi<GetModelsApiResponse>(RequestMethod.GET, path, 10, 2000, isGetModelsApiResponse, setAlert);
      setModelMap(response.modelMap);
    } catch (error) {
      console.error('Error getting available foundation models:', error);
    }
  };

  return (
    <Grid xs>
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        gap={1} // Add spacing between Autocomplete and Tooltip
      >
        <FormControl style={{ width: "100%" }}>
          <FormLabel>{t("page.video.model")}</FormLabel>
          <Grid container>
            <Grid xs={11}>
              <Autocomplete
                value={modelName}
                onInputChange={(_event, newInputValue) => {
                  if (modelMap && newInputValue && Object.keys(modelMap).includes(newInputValue)) {
                    setModelName(newInputValue);
                    handleChooseModel(selectedModelId, modelMap[newInputValue]);
                    setSelectedModelId(modelMap[newInputValue]);
                  }
                }}
                loading={modelMap == undefined}
                disabled={(modelMap == undefined) || loading}
                options={modelMap ? Object.keys(modelMap) : [modelName]}
                endDecorator={!modelMap && <CircularProgress size="sm" />}
                autoHighlight
                disableClearable={true}
                style={{ height: '55px', width: "100%" }}
              />
            </Grid>
            <Grid xs={1} alignContent={"center"}>
              <Tooltip
                title={
                  <Typography style={{ whiteSpace: 'normal', display: 'block', maxWidth: '300px' }}>
                    {t("page.video.choose_model_warning")}
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
      </Box>
    </Grid>
  );
};

export default ModelSelector;
