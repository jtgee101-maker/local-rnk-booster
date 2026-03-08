/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import ABTestDashboard from './pages/ABTestDashboard';
import APILogs from './pages/APILogs';
import Admin from './pages/Admin';
import AdminAuditPlan from './pages/AdminAuditPlan';
import AdminControlCenter from './pages/AdminControlCenter';
import adminDeprecated from './pages/Admin_DEPRECATED';
import AnalyticsVerification from './pages/AnalyticsVerification';
import AutoBodyLanding from './pages/AutoBodyLanding';
import AutoRepairLanding from './pages/AutoRepairLanding';
import BridgeGeenius from './pages/BridgeGeenius';
import BridgeV3 from './pages/BridgeV3';
import CampaignTesting from './pages/CampaignTesting';
import Checkout from './pages/Checkout';
import CheckoutV2 from './pages/CheckoutV2';
import ChiropractorLanding from './pages/ChiropractorLanding';
import ClientDashboard from './pages/ClientDashboard';
import ContractorsLanding from './pages/ContractorsLanding';
import CustomDomainGuide from './pages/CustomDomainGuide';
import Dashboard from './pages/Dashboard';
import DataCleanup from './pages/DataCleanup';
import DentistsLanding from './pages/DentistsLanding';
import DeploymentStatus from './pages/DeploymentStatus';
import DocsHome from './pages/DocsHome';
import DomainConfigGuide from './pages/DomainConfigGuide';
import DomainSetup from './pages/DomainSetup';
import ElectriciansLanding from './pages/ElectriciansLanding';
import Error403 from './pages/Error403';
import Error404 from './pages/Error404';
import Error500 from './pages/Error500';
import FeatureFlags from './pages/FeatureFlags';
import Features from './pages/Features';
import FinalLaunchChecklist from './pages/FinalLaunchChecklist';
import FoxyAuditLanding from './pages/FoxyAuditLanding';
import GettingStarted from './pages/GettingStarted';
import GodModeDashboard from './pages/GodModeDashboard';
import godmodedashboardTest from './pages/GodModeDashboard.test';
import GuideQuizGeenius from './pages/GuideQuizGeenius';
import HVACLanding from './pages/HVACLanding';
import HandymanLanding from './pages/HandymanLanding';
import Home from './pages/Home';
import LandscapingLanding from './pages/LandscapingLanding';
import LawnCareLanding from './pages/LawnCareLanding';
import LegalLanding from './pages/LegalLanding';
import MoltBotDemo from './pages/MoltBotDemo';
import PlumbersLanding from './pages/PlumbersLanding';
import PowerWashingLanding from './pages/PowerWashingLanding';
import PreDeploymentAudit from './pages/PreDeploymentAudit';
import Pricing from './pages/Pricing';
import Privacy from './pages/Privacy';
import ProductionAuditV2 from './pages/ProductionAuditV2';
import ProductionChecklist from './pages/ProductionChecklist';
import ProductionFinalChecklist from './pages/ProductionFinalChecklist';
import ProductionLaunchChecklist from './pages/ProductionLaunchChecklist';
import ProductionReadinessCheck from './pages/ProductionReadinessCheck';
import Quiz from './pages/Quiz';
import QuizGeenius from './pages/QuizGeenius';
import QuizGeeniusV2 from './pages/QuizGeeniusV2';
import QuizV2 from './pages/QuizV2';
import QuizV3 from './pages/QuizV3';
import RealEstateLanding from './pages/RealEstateLanding';
import Referrals from './pages/Referrals';
import RestaurantsLanding from './pages/RestaurantsLanding';
import ResultsGeenius from './pages/ResultsGeenius';
import Roadmap from './pages/Roadmap';
import RoofersLanding from './pages/RoofersLanding';
import SecurityAudit from './pages/SecurityAudit';
import Settings from './pages/Settings';
import StripeSetupGuide from './pages/StripeSetupGuide';
import SystemHealth from './pages/SystemHealth';
import TenantManager from './pages/TenantManager';
import Terms from './pages/Terms';
import Testing from './pages/Testing';
import TestingChecklist from './pages/TestingChecklist';
import ThankYou from './pages/ThankYou';
import Upsell from './pages/Upsell';
import Upsell1 from './pages/Upsell1';
import UserJourneyTest from './pages/UserJourneyTest';
import V2Start from './pages/V2Start';
import AdminDashboard from './pages/AdminDashboard';
import AdminTenants from './pages/AdminTenants';
import AdminUsers from './pages/AdminUsers';
import BrandEditor from './pages/BrandEditor';
import Monitoring from './pages/Monitoring';
import EnterpriseMode from './pages/EnterpriseMode';
import GrowthMode from './pages/GrowthMode';
import QuickStartWizard from './pages/QuickStartWizard';
import AdminSystem from './pages/AdminSystem';
import AdminJobs from './pages/AdminJobs';
import __Layout from './Layout.jsx';


export const PAGES = {
    "ABTestDashboard": ABTestDashboard,
    "APILogs": APILogs,
    "Admin": Admin,
    "AdminAuditPlan": AdminAuditPlan,
    "AdminControlCenter": AdminControlCenter,
    "Admin_DEPRECATED": adminDeprecated,
    "AnalyticsVerification": AnalyticsVerification,
    "AutoBodyLanding": AutoBodyLanding,
    "AutoRepairLanding": AutoRepairLanding,
    "BridgeGeenius": BridgeGeenius,
    "BridgeV3": BridgeV3,
    "CampaignTesting": CampaignTesting,
    "Checkout": Checkout,
    "CheckoutV2": CheckoutV2,
    "ChiropractorLanding": ChiropractorLanding,
    "ClientDashboard": ClientDashboard,
    "ContractorsLanding": ContractorsLanding,
    "CustomDomainGuide": CustomDomainGuide,
    "Dashboard": Dashboard,
    "DataCleanup": DataCleanup,
    "DentistsLanding": DentistsLanding,
    "DeploymentStatus": DeploymentStatus,
    "DocsHome": DocsHome,
    "DomainConfigGuide": DomainConfigGuide,
    "DomainSetup": DomainSetup,
    "ElectriciansLanding": ElectriciansLanding,
    "Error403": Error403,
    "Error404": Error404,
    "Error500": Error500,
    "FeatureFlags": FeatureFlags,
    "Features": Features,
    "FinalLaunchChecklist": FinalLaunchChecklist,
    "FoxyAuditLanding": FoxyAuditLanding,
    "GettingStarted": GettingStarted,
    "GodModeDashboard": GodModeDashboard,
    "GodModeDashboard.test": godmodedashboardTest,
    "GuideQuizGeenius": GuideQuizGeenius,
    "HVACLanding": HVACLanding,
    "HandymanLanding": HandymanLanding,
    "Home": Home,
    "LandscapingLanding": LandscapingLanding,
    "LawnCareLanding": LawnCareLanding,
    "LegalLanding": LegalLanding,
    "MoltBotDemo": MoltBotDemo,
    "PlumbersLanding": PlumbersLanding,
    "PowerWashingLanding": PowerWashingLanding,
    "PreDeploymentAudit": PreDeploymentAudit,
    "Pricing": Pricing,
    "Privacy": Privacy,
    "ProductionAuditV2": ProductionAuditV2,
    "ProductionChecklist": ProductionChecklist,
    "ProductionFinalChecklist": ProductionFinalChecklist,
    "ProductionLaunchChecklist": ProductionLaunchChecklist,
    "ProductionReadinessCheck": ProductionReadinessCheck,
    "Quiz": Quiz,
    "QuizGeenius": QuizGeenius,
    "QuizGeeniusV2": QuizGeeniusV2,
    "QuizV2": QuizV2,
    "QuizV3": QuizV3,
    "RealEstateLanding": RealEstateLanding,
    "Referrals": Referrals,
    "RestaurantsLanding": RestaurantsLanding,
    "ResultsGeenius": ResultsGeenius,
    "Roadmap": Roadmap,
    "RoofersLanding": RoofersLanding,
    "SecurityAudit": SecurityAudit,
    "Settings": Settings,
    "StripeSetupGuide": StripeSetupGuide,
    "SystemHealth": SystemHealth,
    "TenantManager": TenantManager,
    "Terms": Terms,
    "Testing": Testing,
    "TestingChecklist": TestingChecklist,
    "ThankYou": ThankYou,
    "Upsell": Upsell,
    "Upsell1": Upsell1,
    "UserJourneyTest": UserJourneyTest,
    "V2Start": V2Start,
    "AdminDashboard": AdminDashboard,
    "AdminTenants": AdminTenants,
    "AdminUsers": AdminUsers,
    "BrandEditor": BrandEditor,
    "Monitoring": Monitoring,
    "EnterpriseMode": EnterpriseMode,
    "GrowthMode": GrowthMode,
    "QuickStartWizard": QuickStartWizard,
    "AdminSystem": AdminSystem,
    "AdminJobs": AdminJobs,
}

export const pagesConfig = {
    mainPage: "QuizGeenius",
    Pages: PAGES,
    Layout: __Layout,
};