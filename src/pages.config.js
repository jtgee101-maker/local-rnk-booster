import Quiz from './pages/Quiz';
import Checkout from './pages/Checkout';
import Upsell from './pages/Upsell';
import ThankYou from './pages/ThankYou';
import Pricing from './pages/Pricing';


export const PAGES = {
    "Quiz": Quiz,
    "Checkout": Checkout,
    "Upsell": Upsell,
    "ThankYou": ThankYou,
    "Pricing": Pricing,
}

export const pagesConfig = {
    mainPage: "Quiz",
    Pages: PAGES,
};