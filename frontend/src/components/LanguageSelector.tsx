import Select from '@mui/joy/Select';
import Option from '@mui/joy/Option';
import "../App.css";
import React from 'react';
import { useTranslation } from "react-i18next";

/**
 * Props for the LanguageSelector component.
 * @property language - The currently selected language.
 * @property setLanguage - A function to set the selected language.
 */
interface LanguageSelectorProps {
    language: string;
    setLanguage: React.Dispatch<React.SetStateAction<string>>;
}

/**
 * The LanguageSelector component, which allows the user to select the application language.
 * It uses the `i18next` library to change the language and updates the language state accordingly.
 * @param props - The props for the LanguageSelector component.
 * @returns The rendered LanguageSelector component.
 */
export default function LanguageSelector({ language, setLanguage }: LanguageSelectorProps) {
    const { i18n, t } = useTranslation();

    /**
    * Handles the change of the selected language.
    * @param newValue - The new language value selected by the user.
    */
    const handleChangeLanguage = ((newValue: string | null) => {
        if (newValue !== null) {
            setLanguage(newValue);
            i18n.changeLanguage(newValue);
        } else {
            i18n.changeLanguage(undefined);
        }
    }
    );


    /**
     * Generates the options for the language selector.
     * @returns The React nodes for the language options.
     */
    function getOptions(): React.ReactNode {
        return (
            <>
                <Option value="ar-AE">{t("app.languages.ar-AE")}</Option>
                <Option value="ca">{t("app.languages.ca")}</Option>
                <Option value="nl-BE">{t("app.languages.nl-BE")}</Option>
                <Option value="nl-NL">{t("app.languages.nl-NL")}</Option>
                <Option value="en">{t("app.languages.en")}</Option>
                <Option value="fi">{t("app.languages.fi")}</Option>
                <Option value="fr">{t("app.languages.fr")}</Option>
                <Option value="de">{t("app.languages.de")}</Option>
                <Option value="he-IL">{t("app.languages.he-IL")}</Option>
                <Option value="it">{t("app.languages.it")}</Option>
                <Option value="pt-BR">{t("app.languages.pt-BR")}</Option>
                <Option value="pt-PT">{t("app.languages.pt-PT")}</Option>
                <Option value="es">{t("app.languages.es")}</Option>
                <Option value="sv">{t("app.languages.sv")}</Option>
            </>
        )
    }

    return (
        <Select className="menu-button" color="primary" variant="solid" sx={{ mr: 2 }} value={language} onChange={(_event, newValue) => handleChangeLanguage(newValue)}>
            {getOptions()}
        </Select>
    );
}
