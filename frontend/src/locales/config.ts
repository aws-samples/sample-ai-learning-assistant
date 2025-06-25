// src/i18n/config.ts

// Core i18next library.
import i18n from "i18next";
// Bindings for React: allow components to
// re-render when language changes.
import { initReactI18next } from "react-i18next";
// Dynamic value for alerts
import { maxFileSize } from "../components/MediaUploader";

export const supportedLngs = {
    "ar-AE": "Arabic (Gulf)",
    ca: "Catalan",
    "nl-BE": "Dutch (BE)",
    "nl-NL": "Dutch (NL)",
    en: "English (US)",
    fi: "Finnish",
    fr: "French",
    de: "German",
    "he-IL": "Hebrew",
    it: "Italian",
    "pt-BR": "Portuguese (BR)",
    "pt-PT": "Portuguese (PT)",
    es: "Spanish",
    sv: "Swedish",
};

i18n
    // Add React bindings as a plugin.
    .use(initReactI18next)
    // Initialize the i18next instance.
    .init({
        // Config options

        // Specifies the default language (locale) used
        // when a user visits our site for the first time.
        // We use English here, but feel free to use
        // whichever locale you want.                   
        lng: "en",

        // Fallback locale used when a translation is
        // missing in the active locale. Again, use your
        // preferred locale here. 
        fallbackLng: "es",

        // Enables useful output in the browser's
        // dev console.
        debug: true,

        // Normally, we want `escapeValue: true` as it
        // ensures that i18next escapes any code in
        // translation messages, safeguarding against
        // XSS (cross-site scripting) attacks. However,
        // React does this escaping itself, so we turn 
        // it off in i18next.
        interpolation: {
            escapeValue: false,
        },
        supportedLngs: Object.keys(supportedLngs),
        load: 'currentOnly',
        // Translation messages. Add any languages
        // you want here.
        resources: {
            // Arabic (Golf)
            "ar-AE": {
                translation: {
                    app: {
                        languages: {
                            en: "الإنجليزية",
                            es: "الإسبانية",
                            ca: "الكتالونية",
                            it: "الإيطالية",
                            "pt-BR": "البرتغالية (البرازيل)",
                            "pt-PT": "البرتغالية (البرتغال)",
                            de: "الألمانية",
                            fr: "الفرنسية",
                            fi: "الفنلندية",
                            sv: "السويدية",
                            "nl-NL": "الهولندية (هولندا)",
                            "nl-BE": "الهولندية (بلجيكا)",
                            "ar-AE": "العربية (الخليج)",
                            "he-IL": "عبرية",
                        },
                    },
                    page: {
                        landing: {
                            app_title: "مساعد التعلم بالذكاء الاصطناعي",
                            log_out_button: "تسجيل الخروج",
                            hero_title: "مرحبًا بك في التعلم المحسن بالذكاء الاصطناعي",
                            hero_subtitle: "احصل على المزيد من محاضرتك. قم برفع تسجيلك في النموذج ودعنا نظهر لك ما هو ممكن.",
                            hero_button: "ابدأ",
                        },
                        upload: {
                            browseFilesText: "تصفح الملفات",
                            dropFilesText: "اسحب الملفات هنا أو",
                            upload_title: "قم بتحميل ملفك",
                            upload_another: "حاول ملف آخر",
                            uploading_media: "جاري تحميل وسائطك...",
                            get_transcript: "احصل على النص",
                            "upload_success_message": "تم رفع الوسائط بنجاح. يمكنك الآن الحصول على النص أدناه.",
                            "max_file_size_message": `الملف كبير جدًا. الحد الأقصى المسموح به هو ${maxFileSize} ميجا بايت.`,
                        },
                        video: {
                            transcript: "النص الكامل",
                            summary: "الملخص",
                            flashcards: "بطاقات تعليمية",
                            assistant: "مساعد",
                            question: "السؤال:",
                            answer: "الجواب:",
                            show_answer: "اظهر الجواب",
                            hide_answer: "أخف الجواب",
                            type_question: "اكتب سؤالك حول محتوى الملف...",
                            send: "إرسال",
                            language: "اللغة",
                            model: "نموذج",
                            choose_model_warning: "هنا يمكنك اختيار نموذج. يرجى التأكد من تفعيل النماذج المطلوبة وتوافرها في منطقتك لضمان الوظيفة الصحيحة.",
                            "choose_language_warning": "هنا يمكنك اختيار لغة لترجمة المحتوى إليها. إذا كان النموذج المختار قادرًا، فسوف يرد المساعد باللغة المختارة.",
                        }
                    },
                }
            },
            // Catalan
            ca: {
                translation: {
                    app: {
                        languages: {
                            en: "Anglès",
                            es: "Espanyol",
                            ca: "Català",
                            it: "Italià",
                            "pt-BR": "Portuguès (Brasil)",
                            "pt-PT": "Portuguès (Portugal)",
                            de: "Alemany",
                            fr: "Francès",
                            fi: "Finlandès",
                            sv: "Suec",
                            "nl-NL": "Neerlandès (Països Baixos)",
                            "nl-BE": "Neerlandès (Bèlgica)",
                            "ar-AE": "Àrab (del Golf)",
                            "he-IL": "Hebreu",
                        },
                    },
                    page: {
                        landing: {
                            app_title: " Assistent d'aprenentatge amb IA",
                            log_out_button: "Tancar sessió",
                            hero_title: "Benvingut a l'aprenentatge millorat amb IA",
                            hero_subtitle: "Treu més profit de la teva classe. Carrega la teva gravació en el formulari i deixa'ns mostrar-te el que és possible.",
                            hero_button: "Començar",
                        },
                        upload: {
                            browseFilesText: 'Cercar fitxers',
                            dropFilesText: 'Arrossegueu els fitxers aquí o',
                            upload_title: "Pugeu el vostre fitxer",
                            upload_another: "Prova un altre fitxer",
                            uploading_media: "Pujant el teu mitjà...",
                            get_transcript: "Obtenir la transcripció",
                            "upload_success_message": "Mitjà pujat amb èxit. Ara podeu obtenir la transcripció a continuació.",
                            "max_file_size_message": `El fitxer és massa gran. La mida màxima permesa és de ${maxFileSize} MB.`,
                        },
                        video: {
                            transcript: "Transcripció",
                            summary: "Resum",
                            flashcards: "Flashcards",
                            assistant: "Assistent",
                            question: "Pregunta:",
                            answer: "Resposta:",
                            show_answer: "Mostrar resposta",
                            hide_answer: "Amagar resposta",
                            type_question: "Escriu la teva pregunta sobre el contingut...",
                            send: "Enviar",
                            language: "Idioma",
                            model: "Model",
                            "choose_model_warning": "Aquí pots seleccionar un model. Assegura't que els models requerits estiguin activats i disponibles a la teva regió per al seu correcte funcionament.",
                            "choose_language_warning": "Aquí pots seleccionar un idioma per traduir el contingut. Si el model seleccionat ho permet, l'assistent respondrà en l'idioma seleccionat.",
                        }
                    },
                }
            },
            // Dutch (Belgium)
            "nl-BE": {
                translation: {
                    app: {
                        languages: {
                            en: "Engels",
                            es: "Spaans",
                            ca: "Catalaans",
                            it: "Italiaans",
                            "pt-BR": "Portugees (Brazilië)",
                            "pt-PT": "Portugees (Portugal)",
                            de: "Duits",
                            fr: "Frans",
                            fi: "Fins",
                            sv: "Zweeds",
                            "nl-NL": "Nederlands (Nederland)",
                            "nl-BE": "Nederlands (België)",
                            "ar-AE": "Arabisch (Golf)",
                            "he-IL": "Hebreeuws",
                        },
                    },
                    page: {
                        landing: {
                            app_title: "Leerassistent met AI",
                            log_out_button: "Afmelden",
                            hero_title: "Welkom bij verbeterd leren met AI",
                            hero_subtitle: "Haal meer uit je lezing. Upload je opname in het formulier en laat ons je laten zien wat mogelijk is.",
                            hero_button: "Aan de slag",
                        },
                        upload: {
                            browseFilesText: 'Bestanden bladeren',
                            dropFilesText: 'Sleep hier bestanden naartoe of',
                            upload_title: "Upload je bestand",
                            upload_another: "Probeer een andere bestand",
                            uploading_media: "Je media uploaden...",
                            get_transcript: "Transcript ophalen",
                            "upload_success_message": "Media succesvol geüpload. Je kunt nu de transcriptie hieronder krijgen.",
                            "max_file_size_message": `Bestand is te groot. De maximale toegestane grootte is ${maxFileSize} MB.`,

                        },
                        video: {
                            transcript: "Transcriptie",
                            summary: "Samenvatting",
                            flashcards: "Flashcards",
                            assistant: "Assistent",
                            question: "Vraag:",
                            answer: "Antwoord:",
                            show_answer: "Antwoord weergeven",
                            hide_answer: "Antwoord verbergen",
                            type_question: "Typ uw vraag over de inhoud van het bestand...",
                            send: "Verzenden",
                            language: "Taal",
                            model: "Model",
                            "choose_model_warning": "Hier kunt u een model selecteren. Zorg ervoor dat de vereiste modellen zijn geactiveerd en beschikbaar in uw regio voor correcte functionaliteit.",
                            "choose_language_warning": "Hier kun je een taal selecteren om de inhoud naar te vertalen. Als het geselecteerde model daartoe in staat is, zal de assistent in de geselecteerde taal antwoorden.",
                        }
                    },
                }
            },



            // Dutch (Netherlands)
            "nl-NL": {
                translation: {
                    app: {
                        languages: {
                            en: "Engels",
                            es: "Spaans",
                            ca: "Catalaans",
                            it: "Italiaans",
                            "pt-BR": "Portugees (Brazilië)",
                            "pt-PT": "Portugees (Portugal)",
                            de: "Duits",
                            fr: "Frans",
                            fi: "Fins",
                            sv: "Zweeds",
                            "nl-NL": "Nederlands (Nederland)",
                            "nl-BE": "Nederlands (België)",
                            "ar-AE": "Arabisch (Golf)",
                            "he-IL": "Hebreeuws",
                        },
                    },
                    page: {
                        landing: {
                            app_title: "Leerassistent met AI",
                            log_out_button: "Afmelden",
                            hero_title: "Welkom bij verbeterd leren met AI",
                            hero_subtitle: "Haal meer uit je lezing. Upload je opname in het formulier en laat ons je laten zien wat mogelijk is.",
                            hero_button: "Aan de slag",
                        },
                        upload: {
                            browseFilesText: 'Bestanden bladeren',
                            dropFilesText: 'Sleep hier bestanden naartoe of',
                            upload_title: "Upload uw bestand",
                            upload_another: "Probeer een andere bestand",
                            uploading_media: "Je media uploaden...",
                            get_transcript: "Transcript ophalen",
                            "upload_success_message": "Media succesvol geüpload. Je kunt nu de transcriptie hieronder krijgen.",
                            "max_file_size_message": `Bestand is te groot. De maximale toegestane grootte is ${maxFileSize} MB.`,

                        },
                        video: {
                            transcript: "Transcriptie",
                            summary: "Samenvatting",
                            flashcards: "Flashcards",
                            assistant: "Assistent",
                            question: "Vraag:",
                            answer: "Antwoord:",
                            show_answer: "Antwoord weergeven",
                            hide_answer: "Antwoord verbergen",
                            type_question: "Typ uw vraag over de inhoud van het bestand...",
                            send: "Verzenden",
                            language: "Taal",
                            model: "Model",
                            "choose_model_warning": "Hier kunt u een model selecteren. Zorg ervoor dat de vereiste modellen zijn geactiveerd en beschikbaar in uw regio voor goede functionaliteit.",
                            "choose_language_warning": "Hier kun je een taal selecteren om de inhoud naar te vertalen. Als het geselecteerde model hiertoe in staat is, zal de assistent in de geselecteerde taal antwoorden.",
                        }
                    },
                }
            },


            // English
            en: {
                translation: {
                    app: {
                        languages: {
                            en: "English",
                            es: "Spanish",
                            ca: "Catalan",
                            it: "Italian",
                            "pt-BR": "Portuguese (Brazil)",
                            "pt-PT": "Portuguese (Portugal)",
                            de: "German",
                            fr: "French",
                            fi: "Finnish",
                            sv: "Swedish",
                            "nl-NL": "Dutch (Netherlands)",
                            "nl-BE": "Dutch (Belgium)",
                            "ar-AE": "Arabic (Gulf)",
                            "he-IL": "Hebrew",
                        },
                    },
                    page: {
                        landing: {
                            app_title: "AI Learning Assistant",
                            log_out_button: "Sign out",
                            hero_title: "Welcome to improved learning with AI",
                            hero_subtitle: "Get more out of your lecture. Upload your recording in the form and let us show you what is possible.",
                            hero_button: "Get Started",
                        },
                        upload: {
                            browseFilesText: 'Browse files',
                            dropFilesText: 'Drag a file here or',
                            upload_title: "Upload your file",
                            upload_another: "Try another file",
                            uploading_media: "Uploading your file...",
                            get_transcript: "Get transcript",
                            "upload_success_message": "Successfully uploaded media. You can now get the transcript below.",
                            "max_file_size_message":  `File is too large. Maximum allowed size is ${maxFileSize} MB.`,

                        },
                        video: {
                            transcript: "Transcript",
                            summary: "Summary",
                            flashcards: "Flashcards",
                            assistant: "Assistant",
                            question: "Question:",
                            answer: "Answer:",
                            show_answer: "Show answer",
                            hide_answer: "Hide answer",
                            type_question: "Type your question about the content...",
                            send: "Send",
                            language: "Language",
                            model: "Model",
                            "choose_model_warning": "Here you can select a model. Please ensure the required models are activated and available in your region for proper functionality.",
                            "choose_language_warning": "Here you can select a language to translate the content to. If the selected model is capable, the assistant will reply in the selected language.",
                        }
                    },
                }
            },

            // Finnish
            fi: {
                translation: {
                    app: {
                        languages: {
                            en: "Englanti",
                            es: "Espanja",
                            ca: "Katalaani",
                            it: "Italia",
                            "pt-BR": "Portugali (Brasilia)",
                            "pt-PT": "Portugali (Portugali)",
                            de: "Saksa",
                            fr: "Ranska",
                            fi: "Suomi",
                            sv: "Ruotsi",
                            "nl-NL": "Hollanti (Alankomaat)",
                            "nl-BE": "Hollanti (Belgia)",
                            "ar-AE": "Arabia (lahti)",
                            "he-IL": "Heprea",
                        },
                    },
                    page: {
                        landing: {
                            app_title: "Oppimisavustaja tekoälyn avulla",
                            log_out_button: "Kirjaudu ulos",
                            hero_title: "Tervetuloa parempaan oppimiseen tekoälyn avulla",
                            hero_subtitle: "Hyödynnä luentosi paremmin. Lataa tallenteesi lomakkeeseen, niin näytämme sinulle, mitä on mahdollista.",
                            hero_button: "Aloita",
                        },
                        upload: {
                            browseFilesText: 'Selaa tiedostoja',
                            dropFilesText: 'Raahaa tiedostot tähän tai',
                            upload_title: "Lataa tiedosto",
                            upload_another: "Kokeile toista tiedostoa",
                            uploading_media: "Ladataan mediaasi...",
                            get_transcript: "Hanki transkripti",
                            "upload_success_message": "Median lataaminen onnistui. Voit nyt saada tekstin alla.",
                            "max_file_size_message": `Tiedosto on liian suuri. Suurin sallittu koko on ${maxFileSize} MB.`,

                        },
                        video: {

                            transcript: "Transkriptio",
                            summary: "Yhteenveto",
                            flashcards: "Flashcards",
                            assistant: "Avustaja",
                            question: "Kysymys:",
                            answer: "Vastaus:",
                            show_answer: "Näytä vastaus",
                            hide_answer: "Piilota vastaus",
                            type_question: "Kirjoita kysymyksesi sisällöstä...",
                            send: "Lähetä",
                            language: "Kieli",
                            model: "Malli",
                            "choose_model_warning": "Täällä voit valita mallin. Varmista, että vaaditut mallit ovat aktivoitu ja saatavilla alueellasi, jotta ne toimivat oikein.",
                            "choose_language_warning": "Täällä voit valita kielen, johon sisältö käännetään. Jos valittu malli pystyy siihen, avustaja vastaa valitulla kielellä.",
                        }
                    },
                }
            },


            // French
            fr: {
                translation: {
                    app: {
                        languages: {
                            en: "Anglais",
                            es: "Espagnol",
                            ca: "Catalan",
                            it: "Italien",
                            "pt-BR": "Portugais (Brésil)",
                            "pt-PT": "Portugais (Portugal)",
                            de: "Allemand",
                            fr: "Français",
                            fi: "Finlandais",
                            sv: "Suédois",
                            "nl-NL": "Néerlandais (Pays-Bas)",
                            "nl-BE": "Néerlandais (Belgique)",
                            "ar-AE": "Arabe (du Golfe)",
                            "he-IL": "Hébreu",
                        },
                    },
                    page: {
                        landing: {
                            app_title: "Assistant d'apprentissage avec IA",
                            log_out_button: "Se déconnecter",
                            hero_title: "Bienvenue dans l'apprentissage amélioré avec l'IA",
                            hero_subtitle: "Tirez le meilleur de votre cours. Téléchargez votre enregistrement dans le formulaire et laissez-nous vous montrer ce qui est possible.",
                            hero_button: "Commencer",
                        },
                        upload: {
                            browseFilesText: 'Parcourir les fichiers',
                            dropFilesText: 'Déposez les fichiers ici ou',
                            upload_title: "Téléchargez votre fichier",
                            upload_another: "Essayez une autre fichier",
                            uploading_media: "Téléversement de vos médias...",
                            get_transcript: "Obtenir la transcription",
                            "upload_success_message": "Média téléchargé avec succès. Vous pouvez maintenant obtenir la transcription ci-dessous.",
                            "max_file_size_message": `Le fichier est trop grand. La taille maximale autorisée est de ${maxFileSize} Mo.`,

                        },
                        video: {
                            transcript: "Transcription",
                            summary: "Résumé",
                            flashcards: "Flashcards",
                            assistant: "Assistant",
                            question: "Question:",
                            answer: "Réponse:",
                            show_answer: "Afficher la réponse",
                            hide_answer: "Masquer la réponse",
                            type_question: "Tapez votre question sur le contenu...",
                            send: "Envoyer",
                            language: "Langue",
                            model: "Modèle",
                            "choose_model_warning": "Ici, vous pouvez sélectionner un modèle. Veuillez vous assurer que les modèles requis sont activés et disponibles dans votre région pour un bon fonctionnement.",
                            "choose_language_warning": "Ici, vous pouvez sélectionner une langue pour traduire le contenu. Si le modèle sélectionné en est capable, l'assistant répondra dans la langue sélectionnée.",
                        }
                    },
                }
            },


            // Deutch
            de: {
                translation: {
                    app: {
                        languages: {
                            en: "Englisch",
                            es: "Spanisch",
                            ca: "Katalanisch",
                            it: "Italienisch",
                            "pt-BR": "Portugiesisch (Brasilianisch)",
                            "pt-PT": "Portugiesisch (Portugal)",
                            de: "Deutsch",
                            fr: "Französisch",
                            fi: "Finnisch",
                            sv: "Schwedisch",
                            "nl-NL": "Niederländisch (Niederlande)",
                            "nl-BE": "Niederländisch (Belgien)",
                            "ar-AE": "Arabisch (Golf)",
                            "he-IL": "Hebräisch",
                        },
                    },
                    page: {
                        landing: {
                            app_title: "KI-Lernassistent",
                            log_out_button: "Abmelden",
                            hero_title: "Willkommen beim verbesserten Lernen mit KI",
                            hero_subtitle: "Holen Sie mehr aus Ihrer Vorlesung heraus. Laden Sie Ihre Aufnahme im Formular hoch und lassen Sie uns Ihnen zeigen, was möglich ist.",
                            hero_button: "Loslegen",
                        },
                        upload: {
                            browseFilesText: 'Dateien durchsuchen',
                            dropFilesText: 'Dateien hier ablegen oder',
                            upload_title: "Laden Sie Ihre Datei hoch",
                            upload_another: "Versuche es mit einer anderen Datei",
                            uploading_media: "Lade deine Medien hoch...",
                            get_transcript: "Transkript abrufen",
                            "upload_success_message": "Mediendateien erfolgreich hochgeladen. Sie können jetzt die Transkription unten abrufen.",
                            "max_file_size_message": `Die Datei ist zu groß. Die maximale zulässige Größe beträgt ${maxFileSize} MB.`,

                        },
                        video: {
                            transcript: "Transkription",
                            summary: "Zusammenfassung",
                            flashcards: "Flashcards",
                            assistant: "Assistent",
                            question: "Frage:",
                            answer: "Antwort:",
                            show_answer: "Antwort anzeigen",
                            hide_answer: "Antwort ausblenden",
                            type_question: "Geben Sie Ihre Frage zum Inhalt des Materials ein...",
                            send: "Senden",
                            language: "Sprache",
                            model: "Modell",
                            "choose_model_warning": "Hier können Sie ein Modell auswählen. Stellen Sie sicher, dass die erforderlichen Modelle in Ihrer Region aktiviert und verfügbar sind, um eine ordnungsgemäße Funktion zu gewährleisten.",
                            "choose_language_warning": "Ici, vous pouvez sélectionner une langue pour traduire le contenu. Si le modèle sélectionné en est capable, l'assistant répondra dans la langue sélectionnée.",
                        }
                    },
                }
            },
            // Hebrew
            "he-IL": {
                translation: {
                    app: {
                        languages: {
                            en: "אנגלית",
                            es: "ספרדית",
                            ca: "קטלאנית",
                            it: "איטלקית",
                            "pt-BR": "פורטוגזית (ברזיל)",
                            "pt-PT": "פורטוגזית (פורטוגל)",
                            de: "גרמנית",
                            fr: "צרפתית",
                            fi: "פינית",
                            sv: "שוודית",
                            "nl-NL": "הולנדית (הולנד)",
                            "nl-BE": "הולנדית (בלגיה)",
                            "ar-AE": "ערבית (המפרץ)",
                            "he-IL": "עברית",
                        },
                    },
                    page: {
                        landing: {
                            app_title: "עוזר למידה עם בינה מלאכותית",
                            log_out_button: "התנתק",
                            hero_title: "ברוך הבא ללמידה משופרת עם בינה מלאכותית",
                            hero_subtitle: "קבל יותר מההרצאה שלך. העלה את ההקלטה שלך בטופס ותן לנו להראות לך מה אפשרי.",
                            hero_button: "התחל",
                        },
                        upload: {
                            browseFilesText: "חפש קבצים",
                            dropFilesText: "גרור את הקבצים לכאן או",
                            upload_title: "העלה את הקובץ שלך",
                            upload_another: "נסה קובץ אחר",
                            uploading_media: "מעלה את המדיה שלך...",
                            get_transcript: "קבל תמליל",
                            "upload_success_message": "המדיה הועלתה בהצלחה. אתה יכול עכשיו לקבל את ההתמלול למטה.",
                            "max_file_size_message":  `הקובץ גדול מדי. הגודל המקסימלי המותר הוא ${maxFileSize} מגה-בייט.`,

                        },
                        video: {
                            transcript: "תמלול",
                            summary: "סיכום",
                            flashcards: "כרטיסיות",
                            assistant: "עוזר",
                            question: "שאלה:",
                            answer: "תשובה:",
                            show_answer: "הצג תשובה",
                            hide_answer: "הסתר תשובה",
                            type_question: "הקלד את שאלתך לגבי תוכן הקובץ...",
                            send: "שלח",
                            language: "שפה",
                            model: "מודל",
                            "choose_model_warning": "כאן תוכל לבחור מודל. ודא שהמודלים הנדרשים מופעלים וזמינים באזור שלך לפעולה תקינה.",
                            "choose_language_warning": "כאן תוכל לבחור שפה לתרגום התוכן. אם המודל הנבחר מסוגל, הסייען יגיב בשפה שנבחרה.",
                        }
                    },
                }
            },
            //Italian
            it: {
                translation: {
                    app: {
                        languages: {
                            en: "Inglese",
                            es: "Spagnolo",
                            ca: "Catalano",
                            it: "Italiano",
                            "pt-BR": "Portoghese (Brasile)",
                            "pt-PT": "Portoghese (Portogallo)",
                            de: "Tedesco",
                            fr: "Francese",
                            fi: "Finlandese",
                            sv: "Svedese",
                            "nl-NL": "Olandese (Paesi Bassi)",
                            "nl-BE": "Olandese (Belgio)",
                            "ar-AE": "Arabo (Golfo)",
                            "he-IL": "Ebraico",
                        },
                    },
                    page: {
                        landing: {
                            app_title: "Assistente di apprendimento con IA",
                            log_out_button: "Esci",
                            hero_title: "Benvenuto(a) nell'apprendimento migliorato con l'IA",
                            hero_subtitle: "Ottieni di più dalla tua lezione. Carica la tua registrazione nel modulo e lascia che ti mostriamo cosa è possibile.",
                            hero_button: "Inizia",

                        },
                        upload: {
                            browseFilesText: 'Sfoglia i file',
                            dropFilesText: 'Trascina i file qui o',
                            upload_title: "Carica il tuo media",
                            upload_another: "Prova un altro media",
                            uploading_media: "Caricamento dei tuoi media...",
                            get_transcript: "Ottieni trascrizione",
                            "upload_success_message": "Media caricato con successo. Ora puoi ottenere la trascrizione qui sotto.",
                            "max_file_size_message": `Il file è troppo grande. La dimensione massima consentita è di ${maxFileSize} MB.`

                        },
                        video: {
                            transcript: "Trascrizione",
                            summary: "Sommario",
                            flashcards: "Flashcards",
                            assistant: "Assistente",
                            question: "Domanda:",
                            answer: "Risposta:",
                            show_answer: "Mostra risposta",
                            hide_answer: "Nascondi risposta",
                            type_question: "Scrivi la tua domanda sul contenuto...",
                            send: "Invia",
                            language: "Lingua",
                            model: "Modello",
                            "choose_model_warning": "Qui puoi selezionare un modello. Assicurati che i modelli richiesti siano attivati e disponibili nella tua regione per il corretto funzionamento.",
                            "choose_language_warning": "Qui puoi selezionare una lingua per tradurre il contenuto. Se il modello selezionato è in grado, l'assistente risponderà nella lingua selezionata.",
                        }
                    },
                }
            },

            // Português (Brasil)
            "pt-BR": {
                translation: {
                    app: {
                        languages: {
                            en: "Inglês",
                            es: "Espanhol",
                            ca: "Catalão",
                            it: "Italiano",
                            "pt-BR": "Português (Brasil)",
                            "pt-PT": "Português (Portugal)",
                            de: "Alemão",
                            fr: "Francês",
                            fi: "Finlandês",
                            sv: "Sueco",
                            "nl-NL": "Holandês (Países Baixos)",
                            "nl-BE": "Holandês (Bélgica)",
                            "ar-AE": "Árabe (Golfo)",
                            "he-IL": "Hebraico",
                        },
                    },
                    page: {
                        landing: {
                            app_title: "Assistente de aprendizado com IA",
                            log_out_button: "Sair",
                            hero_title: "Bem-vindo(a) ao aprendizado aprimorado com IA",
                            hero_subtitle: "Aproveite mais sua aula. Faça upload da sua gravação no formulário e deixe-nos mostrar o que é possível.",
                            hero_button: "Começar",

                        },
                        upload: {
                            browseFilesText: 'Procurar arquivos',
                            dropFilesText: 'Arraste um arquivo para aqui ou',
                            upload_title: "Faça upload do seu arquivo",
                            upload_another: "Teste com outro arquivo",
                            uploading_media: "Enviando seu mídia...",
                            get_transcript: "Obter transcrição",
                            "upload_success_message": "Mídia carregada com sucesso. Agora você pode obter a transcrição abaixo.",
                            "max_file_size_message": `O arquivo é muito grande. O tamanho máximo permitido é de ${maxFileSize} MB.`

                        },
                        video: {
                            transcript: "Transcrição",
                            summary: "Resumo",
                            flashcards: "Flashcards",
                            assistant: "Assistente",
                            question: "Pergunta:",
                            answer: "Resposta:",
                            show_answer: "Mostrar resposta",
                            hide_answer: "Ocultar resposta",
                            type_question: "Digite sua pergunta sobre o conteúdo...",
                            send: "Enviar",
                            language: "Idioma",
                            model: "Modelo",
                            "choose_model_warning": "Aqui você pode selecionar um modelo. Certifique-se de que os modelos necessários estejam ativados e disponíveis em sua região para o funcionamento adequado.",
                            "choose_language_warning": "Aqui você pode selecionar um idioma para traduzir o conteúdo. Se o modelo selecionado for capaz, o assistente responderá no idioma selecionado.",
                        }
                    },
                }
            },

            // Português (Portugal)
            "pt-PT": {
                translation: {
                    app: {
                        languages: {
                            en: "Inglês",
                            es: "Espanhol",
                            ca: "Catalão",
                            it: "Italiano",
                            "pt-BR": "Português (Brasil)",
                            "pt-PT": "Português (Portugal)",
                            de: "Alemão",
                            fr: "Francês",
                            fi: "Finlandês",
                            sv: "Sueco",
                            "nl-NL": "Holandês (Países Baixos)",
                            "nl-BE": "Holandês (Bélgica)",
                            "ar-AE": "Árabe (do Golfo)",
                            "he-IL": "Hebraico",
                        },
                    },
                    page: {
                        landing: {
                            app_title: "Assistente de aprendizagem com IA",
                            log_out_button: "Terminar sessão",
                            hero_title: "Bem-vindo(a) à aprendizagem melhorada com IA",
                            hero_subtitle: "Tire mais proveito da sua aula. Faça upload da sua gravação no formulário e deixe-nos mostrar-lhe o que é possível.",
                            hero_button: "Começar",

                        },
                        upload: {
                            browseFilesText: 'Procurar ficheiros',
                            dropFilesText: 'Arraste o ficheiro para aqui ou',
                            upload_title: "Faça upload do seu ficheiro",
                            upload_another: "Teste com outro ficheiro",
                            uploading_media: "A carregar o seu ficheiro...",
                            get_transcript: "Obter transcrição",
                            "upload_success_message": "Ficheiro carregado com sucesso. Agora pode obter a transcrição abaixo.",
                            "max_file_size_message": `O ficheiro é demasiado grande. O tamanho máximo permitido é de ${maxFileSize} MB.`
                        },
                        video: {
                            transcript: "Transcrição",
                            summary: "Resumo",
                            flashcards: "Flashcards",
                            assistant: "Assistente",
                            question: "Pergunta:",
                            answer: "Resposta:",
                            show_answer: "Mostrar resposta",
                            hide_answer: "Ocultar resposta",
                            type_question: "Digite a sua pergunta sobre o conteúdo...",
                            send: "Enviar",
                            language: "Idioma",
                            model: "Modelo",
                            "choose_model_warning": "Aqui pode selecionar um modelo. Certifique-se de que os modelos necessários estão ativados e disponíveis na sua região para o correto funcionamento.",
                            "choose_language_warning": "Aqui pode selecionar um idioma para traduzir o conteúdo. Se o modelo selecionado for capaz, o assistente responderá na língua selecionada.",
                        }
                    },
                }
            },


            // Spanish
            es: {
                translation: {
                    app: {
                        languages: {
                            en: "Inglés",
                            es: "Español",
                            ca: "Catalán",
                            it: "Italiano",
                            "pt-BR": "Portugués (Brasil)",
                            "pt-PT": "Portugués (Portugal)",
                            de: "Alemán",
                            fr: "Francés",
                            fi: "Finlandés",
                            sv: "Sueco",
                            "nl-NL": "Holandés (Países Bajos)",
                            "nl-BE": "Holandés (Bélgica)",
                            "ar-AE": "Árabe (del Golfo)",
                            "he-IL": "Hebreo",
                        },
                    },
                    page: {
                        landing: {
                            app_title: "Asistente de aprendizaje con IA",
                            log_out_button: "Cerrar sesión",
                            hero_title: "Bienvenido(a) al aprendizaje mejorado con IA",
                            hero_subtitle: "Obtén más de tu clase. Sube tu grabación en el formulario y déjanos mostrarte lo que es posible.",
                            hero_button: "Comenzar",
                        },
                        upload: {
                            browseFilesText: 'Buscar archivos',
                            dropFilesText: 'Arrastre los archivos aquí o',
                            upload_title: "Sube tu archivo",
                            upload_another: "Prueba otro archivo",
                            uploading_media: "Subiendo tu archivo...",
                            get_transcript: "Obtener transcripción",
                            "upload_success_message": "Archivo cargado con éxito. Ahora puedes obtener la transcripción a continuación.",
                            "max_file_size_message": `El archivo es demasiado grande. El tamaño máximo permitido es de ${maxFileSize} MB.`,

                        },
                        video: {
                            transcript: "Transcripción",
                            summary: "Resumen",
                            flashcards: "Flashcards",
                            assistant: "Asistente",
                            question: "Pregunta:",
                            answer: "Respuesta:",
                            show_answer: "Mostrar respuesta",
                            hide_answer: "Ocultar respuesta",
                            type_question: "Escribe tu pregunta sobre el contenido...",
                            send: "Enviar",
                            language: "Idioma",
                            model: "Modelo",
                            "choose_model_warning": "Aquí puedes seleccionar un modelo. Asegúrate de que los modelos requeridos estén activados y disponibles en tu región para su correcto funcionamiento.",
                            "choose_language_warning": "Aquí puedes seleccionar un idioma para traducir el contenido. Si el modelo seleccionado es capaz, el asistente responderá en el idioma seleccionado.",

                        }
                    },
                }
            },

            // Swedish
            sv: {
                translation: {
                    app: {
                        languages: {
                            en: "Engelska",
                            es: "Spanska",
                            ca: "Katalanska",
                            it: "Italienska",
                            "pt-BR": "Portugisiska (Brasilien)",
                            "pt-PT": "Portugisiska (Portugal)",
                            de: "Tyska",
                            fr: "Franska",
                            fi: "Finska",
                            sv: "Svenska",
                            "nl-NL": "Nederländska (Nederländerna)",
                            "nl-BE": "Nederländska (Belgien)",
                            "ar-AE": "Arabiska (Persiska viken)",
                            "he-IL": "Hebreiska",
                        },
                    },
                    page: {
                        landing: {
                            app_title: "AI-lärarassistent",
                            log_out_button: "Logga ut",
                            hero_title: "Välkommen till en ny föreläsningssalsupplevelse",
                            hero_subtitle: "Få ut mesta möjliga av din presentation i klassrummet. Ladda upp inspelningen till vårt formulär och låt oss visa vad som är möjligt.",
                            hero_button: "Kom igång",
                        },
                        upload: {
                            browseFilesText: 'Bläddra bland filer',
                            dropFilesText: 'Släpp filer här eller',
                            upload_title: "Ladda upp din fil",
                            upload_another: "Försök med en annan fil",
                            uploading_media: "Laddar upp ditt media...",
                            get_transcript: "Hämta transkript",
                            "upload_success_message": "Media uppladdad med framgång. Du kan nu få transkriptionen nedan.",
                            "max_file_size_message": `Filen är för stor. Maximal tillåten storlek är ${maxFileSize} MB.`,

                        },
                        video: {
                            transcript: "Transkription",
                            summary: "Sammanfattning",
                            flashcards: "Flashcards",
                            assistant: "Assistent",
                            question: "Fråga:",
                            answer: "Svar:",
                            show_answer: "Visa svar",
                            hide_answer: "Dölj svar",
                            type_question: "Skriv din fråga om innehållet...",
                            send: "Skicka",
                            language: "Språk",
                            model: "Modellen",
                            "choose_model_warning": "Här kan du välja en modell. Se till att de nödvändiga modellerna är aktiverade och tillgängliga i din region för att säkerställa korrekt funktion.",
                            "choose_language_warning": "Här kan du välja ett språk att översätta innehållet till. Om den valda modellen klarar det kommer assistenten att svara på det valda språket.",
                        }
                    },
                }
            },

        }
    });

export default i18n;