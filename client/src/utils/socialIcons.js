import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import XIcon from '@mui/icons-material/X';
import YouTubeIcon from '@mui/icons-material/YouTube';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import PinterestIcon from '@mui/icons-material/Pinterest';
import LanguageIcon from '@mui/icons-material/Language';

const SOCIAL_ICON_MAP = {
  fb: FacebookIcon,
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  twitter: XIcon,
  x: XIcon,
  youtube: YouTubeIcon,
  linkedin: LinkedInIcon,
  pinterest: PinterestIcon,
};

export function getSocialIcon(key) {
  return SOCIAL_ICON_MAP[key.toLowerCase()] || LanguageIcon;
}
