import type { Metadata } from 'next';
import AskPage from '../../ask/page';

export const metadata: Metadata = {
  title: 'Сформулюйте своє запитання — Olivia Arcana',
  description: 'Простір, щоб осмислити ситуацію, уточнити запитання й перейти до власного розкладу таро.',
  alternates: { canonical: 'https://oliviaarcana.com/uk/ask/', languages: { en: 'https://oliviaarcana.com/ask/', uk: 'https://oliviaarcana.com/uk/ask/' } },
};

export default AskPage;
