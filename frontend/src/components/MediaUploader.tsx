import { Box, Button, Typography } from '@mui/joy';
import { useTranslation } from "react-i18next";
import { UploadFile as UploadFileIcon } from '@mui/icons-material';
import { useState } from 'react';
import { styled } from '@mui/joy/styles';
import AnimatedWrapper from './AnimatedWrapper';
import { fetchAuthSession } from 'aws-amplify/auth';
import { uploadToS3 } from '../utils/awsUtils';
import { UPLOAD_FILE_TYPES } from '../utils/fileTypeUtils';

/**
 * Styled component for the upload area.
 * It has a dashed border, rounded corners, and a hover effect.
 */
const UploadArea = styled(Box)(({ theme }) => ({
  border: '1px dashed',
  borderColor: theme.vars.palette.primary.mainChannel,
  borderRadius: theme.vars.radius.sm,
  padding: theme.spacing(6),
  textAlign: 'center',
  width: '100%',
  maxWidth: '900px', // Constrain the max width for responsive design
  margin: '0 auto', // Center horizontally within the parent
  boxSizing: 'border-box',
  transition: 'background-color 0.3s ease',
  '&:hover': {
    backgroundColor: theme.vars.palette.primary.plainHoverBg,
  },
}));

/**
 * Represents the information about a selected file.
 * @property file - The selected file.
 * @property uploadProgress - The progress of the file upload.
 * @property uploadError - Any error that occurred during the file upload.
 */
interface FileInfo {
  file: File;
  uploadProgress: number;
  uploadError: string;
}

/**
 * Props for the MediaUploader component.
 * @property setFileKey - A function to set the file key.
 * @property setVideoUrl - A function to set the video URL.
 * @property setMediaUploaded - A function to set the media uploaded flag.
 * @property setAlert - A function to set the alert state.
 */
interface MediaUploaderProps {
  setFileKey: React.Dispatch<React.SetStateAction<string>>;
  setVideoUrl: React.Dispatch<React.SetStateAction<string | null>>;
  setMediaUploaded: React.Dispatch<React.SetStateAction<boolean>>;
  setAlert: React.Dispatch<React.SetStateAction<{
    status: "Success" | "Error" | "Warning" | null;
    message: string;
  }>>
}

/**
 * Constant to set the maximum file size that can be uploaded for transcription.
 */
export const maxFileSize = 500; // 500MB size limit

/**
 * The MediaUploader component, which allows the user to upload a video file.
 * It generates a deterministic hash as the file key, uploads the file to S3,
 * and updates the state accordingly.
 * @param props - The props for the MediaUploader component.
 * @returns The rendered MediaUploader component.
 */
const MediaUploader: React.FC<MediaUploaderProps> = ({
  setFileKey,
  setVideoUrl,
  setMediaUploaded,
  setAlert
}) => {

  const { t } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<FileInfo | undefined | null>();
  const [dragging, setDragging] = useState(false);
  
  // Generate a deterministic hash as file key 
  const processFile = async (file: File) => {
    const fileExtension = file.name.split('.').pop();
    const timestamp = new Date().getTime();
    const identityId = (await fetchAuthSession()).identityId ?? {};
    return file
      .arrayBuffer()
      .then((fileBuffer: any) => window.crypto.subtle.digest('SHA-1', fileBuffer))
      .then((hashBuffer: any) => {
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray
          .map((a) => a.toString(16).padStart(2, '0'))
          .join('');
        return { file, key: `videos/${hashHex}-${timestamp}.${fileExtension}`, s3Key: `${identityId}/videos/${hashHex}-${timestamp}.${fileExtension}` };
      });
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (files && files.length > 0) {
      const file: File = Array.prototype.slice.call(files).at(0);
      if (file.size > (maxFileSize * 1024 * 1024)) {
        setAlert({
          status: "Error",
          message: t("page.upload.max_file_size_message")
        });
      } else {
        const processedFile = await processFile(file);
        setFileKey(processedFile.key);
        const url = URL.createObjectURL(file);
        setVideoUrl(url);

        const modifiedFile: FileInfo = {
          file: file,
          uploadProgress: 20,
          uploadError: "test",
        }

        setSelectedFile(modifiedFile);

        uploadToS3(processedFile.s3Key, file).then(
          function (_data) {
            setMediaUploaded(true);
            setAlert({
              status: "Success",
              message: t("page.upload.upload_success_message")
            });
          },
          function (err) {
            return console.error("There was an error uploading your video: " + err.message);
          }
        );
      }
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragging(false);

    handleFileSelect(event.dataTransfer.files);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragging(false);
  };

  return (
    <AnimatedWrapper initialY={100} animateY={0}>
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', padding: 4, }}>
        <Typography level="h2" fontWeight="l" sx={{ mb: 4 }}>{t("page.upload.upload_title")}</Typography>
        <UploadArea
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          style={{
            backgroundColor: dragging ? '#f5f5f5' : 'inherit' // Change background on drag
          }}
        >
          <UploadFileIcon color="action" fontSize="large" />
          <Typography level="body-md" sx={{ p: 2 }}>{t("page.upload.dropFilesText")}</Typography>
          <Box sx={{ mt: 1 }}>
            <Button
              variant="outlined"
              component="label"
              style={{ textTransform: "none" }}
            >
              <input
                hidden
                type="file"
                accept={UPLOAD_FILE_TYPES.toString()}
                onChange={(e) => handleFileSelect(e.target.files)}
              />
              {!selectedFile && <span>{t("page.upload.browseFilesText")}</span>}
            </Button>
          </Box>
        </UploadArea>
      </Box>
    </AnimatedWrapper>
  );
};

export default MediaUploader;