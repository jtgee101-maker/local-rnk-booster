import Quiz from './pages/Quiz';
import Checkout from './pages/Checkout';
import Upsell from './pages/Upsell';
import ThankYou from './pages/ThankYou';
import Pricing from './pages/Pricing';
import Upsell1 from './pages/Upsell1';
import Dashboard from './pages/Dashboard';


export const PAGES = {
    "Quiz": Quiz,
    "Checkout": Checkout,
    "Upsell": Upsell,
    "ThankYou": ThankYou,
    "Pricing": Pricing,
    "Upsell1": Upsell1,
    "Dashboard": Dashboard,
}

export const pagesConfig = {
    mainPage: "Quiz",
    Pages: PAGES,
};