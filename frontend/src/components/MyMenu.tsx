import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/joy/Typography';
import Button from '@mui/joy/Button';
import SchoolIcon from '@mui/icons-material/School';
import LogoutIcon from '@mui/icons-material/Logout';
import { useTranslation } from "react-i18next";
import LanguageSelector from './LanguageSelector';
import { AuthEventData } from '@aws-amplify/ui';

interface MyMenuProps {
signOut: (data?: AuthEventData | undefined) => void
  language: string;
  setLanguage: React.Dispatch<React.SetStateAction<string>>
}

export default function MyMenu({ signOut, language, setLanguage }: MyMenuProps) {

  const { t } = useTranslation();

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography level="h4" textColor="common.white" sx={{ flexGrow: 1, ml: 0 }} startDecorator={<SchoolIcon />}>
            {t("page.landing.app_title")}
          </Typography>
          <LanguageSelector language={language} setLanguage={setLanguage}/>
          <Button size="md" sx={{ mr: 0 }} onClick={signOut} startDecorator={<LogoutIcon />}>
          {t("page.landing.log_out_button")}
          </Button>
        </Toolbar>
      </AppBar>
    </Box>
  );
}
