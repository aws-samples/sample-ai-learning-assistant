
import Button from '@mui/joy/Button';
import Typography from '@mui/joy/Typography';
import "../App.css"
import { useTranslation } from "react-i18next";
import TwoSidedLayout from './TwoSidedLayout';
import ArrowForward from '@mui/icons-material/ArrowForward';
import AnimatedWrapper from './AnimatedWrapper';

/**
 * Props for the Hero component.
 * @property showHero - Whether to show the hero section.
 * @property handleGetStarted - A function to handle the "Get Started" button click.
 */
interface HeroProps {
  showHero: boolean;
  handleGetStarted: () => void;
}

/**
 * The Hero component, which renders the hero section of the application.
 * The hero section includes a title, subtitle, and a "Get Started" button.
 * The component is wrapped in an `AnimatedWrapper` component to provide a smooth animation effect.
 * @param props - The props for the Hero component.
 * @returns The rendered Hero component.
 */
const Hero: React.FC<HeroProps> = ({
  showHero,
  handleGetStarted
}) => {
  const { t } = useTranslation();
  return (
    <AnimatedWrapper initialY={-100} animateY={0} show={showHero}>
      <TwoSidedLayout reversed>
        <Typography level="h1" fontWeight="xl" fontSize="clamp(1.875rem, 1.3636rem + 2.1818vw, 3rem)">{t("page.landing.hero_title")}</Typography>
        <Typography fontSize="lg" textColor="text.secondary" lineHeight="lg">{t("page.landing.hero_subtitle")}</Typography>
        <Button size="lg" endDecorator={<ArrowForward />} sx={{ mt: 2, mb: 1 }} onClick={handleGetStarted}>{t("page.landing.hero_button")}</Button>
      </TwoSidedLayout>
    </AnimatedWrapper>

  );
};

export default Hero;