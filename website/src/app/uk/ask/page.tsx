import type { Metadata } from 'next';
import AskPage from '../../ask/page';
import { socialImages, socialImageUrls } from '@/lib/social-images';

export const metadata: Metadata = {
  title: 'Сформулюйте своє запитання — Olivia Arcana',
  description: 'Простір, щоб осмислити ситуацію, уточнити запитання й перейти до власного розкладу таро.',
  alternates: { canonical: 'https://oliviaarcana.com/uk/ask/', languages: { en: 'https://oliviaarcana.com/ask/', uk: 'https://oliviaarcana.com/uk/ask/' } },
  openGraph: { title: 'Сформулюйте своє запитання — Olivia Arcana', description: 'Простір, щоб осмислити ситуацію, уточнити запитання й перейти до власного розкладу таро.', url: 'https://oliviaarcana.com/uk/ask/', locale: 'uk_UA', alternateLocale: ['en_US'], type: 'website', siteName: 'Olivia Arcana', images: socialImages('uk') },
  twitter: { card: 'summary_large_image', title: 'Сформулюйте своє запитання — Olivia Arcana', description: 'Простір, щоб осмислити ситуацію, уточнити запитання й перейти до власного розкладу таро.', images: socialImageUrls('uk') },
};

export default AskPage;
