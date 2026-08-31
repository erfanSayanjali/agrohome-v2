import NotFoundPage from '../../components/main/error/NotFoundPage';

export const metadata = {
  title: 'صفحه پیدا نشد | آگروهوم',
  description: 'صفحه‌ای که دنبال آن بودید پیدا نشد. به صفحه اصلی یا فروشگاه محصولات بازگردید.',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return <NotFoundPage />;
}
