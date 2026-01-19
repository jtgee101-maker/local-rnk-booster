import ABTestDashboard from './pages/ABTestDashboard';
import Admin from './pages/Admin';
import Checkout from './pages/Checkout';
import Dashboard from './pages/Dashboard';
import Pricing from './pages/Pricing';
import Privacy from './pages/Privacy';
import Quiz from './pages/Quiz';
import Terms from './pages/Terms';
import ThankYou from './pages/ThankYou';
import Upsell from './pages/Upsell';
import Upsell1 from './pages/Upsell1';
import Settings from './pages/Settings';
import CheckoutV2 from './pages/CheckoutV2';


export const PAGES = {
    "ABTestDashboard": ABTestDashboard,
    "Admin": Admin,
    "Checkout": Checkout,
    "Dashboard": Dashboard,
    "Pricing": Pricing,
    "Privacy": Privacy,
    "Quiz": Quiz,
    "Terms": Terms,
    "ThankYou": ThankYou,
    "Upsell": Upsell,
    "Upsell1": Upsell1,
    "Settings": Settings,
    "CheckoutV2": CheckoutV2,
}

export const pagesConfig = {
    mainPage: "Quiz",
    Pages: PAGES,
};