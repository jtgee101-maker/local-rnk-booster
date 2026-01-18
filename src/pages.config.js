import Checkout from './pages/Checkout';
import Dashboard from './pages/Dashboard';
import Pricing from './pages/Pricing';
import Quiz from './pages/Quiz';
import ThankYou from './pages/ThankYou';
import Upsell from './pages/Upsell';
import Upsell1 from './pages/Upsell1';
import Admin from './pages/Admin';


export const PAGES = {
    "Checkout": Checkout,
    "Dashboard": Dashboard,
    "Pricing": Pricing,
    "Quiz": Quiz,
    "ThankYou": ThankYou,
    "Upsell": Upsell,
    "Upsell1": Upsell1,
    "Admin": Admin,
}

export const pagesConfig = {
    mainPage: "Quiz",
    Pages: PAGES,
};