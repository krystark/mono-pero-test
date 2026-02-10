import { router, nav } from '@krystark/app-kernel';
import PortalHome from './pages/PortalHome';
import PortalNews from './pages/PortalNews';
import { HomeIcon } from '@krystark/ui-kit-icons';

// Главная
router.add({
    id: 'portal-home',
    path: '/',
    Element: PortalHome,
});

nav.add({
    id: 'portal-home',
    title: 'Главная',
    url: '/',
    order: 0,
    icon: HomeIcon,
} as any);

// Страница новостей
router.add({
    id: 'portal-news',
    path: '/news',
    Element: PortalNews,
});