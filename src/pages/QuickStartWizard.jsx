import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import {
  CheckCircle2, Circle, ArrowRight, ArrowLeft,
  Building2, CreditCard, Rocket, Briefcase, Sparkles,
  Loader2, Star, TrendingUp, Shield, Clock, Award, Check, Lock, Globe, Target
} from 'lucide-react';

const industryTemplates = [
  { id: 'home_services', name: 'Home Services', icon: '🔧', color: 'from-amber-600 to-yellow-600', optimizations: ['Service areas', 'Quote requests', 'Project galleries', 'Emergency services'], estimatedImpact: '+48% visibility', setupTime: '4 min' },
  { id: 'healthcare', name: 'Healthcare & Medical', icon: '🏥', color: 'from-blue-500 to-cyan-500', optimizations: ['Appointment scheduling', 'Provider bios', 'Insurance keywords'], estimatedImpact: '+38% visibility', setupTime: '4 min' },
  { id: 'legal', name: 'Legal Services', icon: '⚖️', color: 'from-slate-600 to-slate-800', optimizations: ['Case type targeting', 'Consultation booking', 'Attorney profiles'], estimatedImpact: '+52% visibility', setupTime: '3 min' },
  { id: 'realestate', name: 'Real Estate', icon: '🏠', color: 'from-green-500 to-emerald-500', optimizations: ['Property listings', 'Virtual tours', 'Neighborhood pages'], estimatedImpact: '+41% visibility', setupTime: '4 min' },
  { id: 'automotive', name: 'Automotive Services', icon: '🚗', color: 'from-red-500 to-pink-500', optimizations: ['Service scheduling', 'Parts inventory', 'Vehicle galleries'], estimatedImpact: '+35% visibility', setupTime: '3 min' },
  { id: 'retail', name: 'Retail & E-commerce', icon: '🛍️', color: 'from-purple-500 to-violet-500', optimizations: ['Product SEO', 'Inventory sync', 'Local pickup'], estimatedImpact: '+43% visibility', setupTime: '3 min' },
  { id: 'fitness', name: 'Fitness & Wellness', icon: '💪', color: 'from-yellow-500 to-orange-500', optimizations: ['Class scheduling', 'Trainer profiles', 'Wellness content'], estimatedImpact: '+39% visibility', setupTime: '3 min' },
  { id: 'restaurant', name: 'Restaurant & Food', icon: '🍽️', color: 'from-orange-500 to-red-500', optimizations: ['Menu SEO', 'Reservation booking', 'Review generation'], estimatedImpact: '+45% visibility', setupTime: '3 min' },
];

const packages = [
  { id: 'starter', name: 'Starter Boost', price: 49, description: 'Essential optimization for small businesses', features: ['GMB optimization', '5 keyword targets', 'Monthly reports', 'Review monitoring'], popular: false },
  { id: 'growth', name: 'Growth Accelerator', price: 99, description: 'Comprehensive growth for ambitious businesses', features: ['Everything in Starter', '15 keyword targets', 'Weekly reports', 'Review automation', 'Citation building', 'Competitor tracking'], popular: true },
  { id: 'domination', name: 'Market Domination', price: 199, description: 'Full-scale domination of your local market', features: ['Everything in Growth', 'Unlimited keywords', 'Daily monitoring', 'Content creation', 'Priority support'], popular: false },
];

// Step Indicator
const StepIndicator = ({ currentStep }) => {
  const steps = [
    { icon: Building2, label: 'Connect' },
    { icon: Briefcase, label: 'Business' },
    { icon: Sparkles, label: 'Package' },
    { icon: CreditCard, label: 'Payment' },
    { icon: Rocket, label: 'Launch' }
  ];
  return (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center space-x-2 md:space-x-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index + 1 === currentStep;
          const isCompleted = index + 1 < currentStep;
          return (
            <React.Fragment key={index}>
              <div className={`flex flex-col items-center ${isActive ? 'text-blue-500' : isCompleted ? 'text-green-500' : 'text-slate-400'}`}>
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center ${isActive ? 'bg-blue-500 text-white shadow-lg' : isCompleted ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {isCompleted ? <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" /> : <Icon className="w-5 h-5 md:w-6 md:h-6" />}
                </div>
                <span className="text-xs mt-1 hidden md:block font-medium">{step.label}</span>
              </div>
              {index < steps.length - 1 && (
                <div className="w-8 md:w-16 h-1 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: isCompleted ? '100%' : '0%' }} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

// Step 1: Connect
const Step1Connect = ({ onNext, data, updateData }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  const handleConnect = async () => {
    setIsConnecting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    updateData({ gmbConnected: true, gmbEmail: 'business@example.com' });
    toast({ title: 'Successfully connected!', description: 'Your Google Business Profile has been linked.' });
    setIsConnecting(false);
    onNext();
  };
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Connect Your Google Business Profile</h2>
        <p className="text-slate-600">Link your GMB to enable automatic optimization and tracking.</p>
      </div>
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-6">
          {data.gmbConnected ? (
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Connected Successfully!</h3>
                <p className="text-slate-600">{data.gmbEmail}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center mb-4">
                <Globe className="w-10 h-10 text-blue-500" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Secure OAuth Connection</h3>
              <p className="text-sm text-slate-600 mb-4 max-w-sm">We use Google's official OAuth to securely access your business profile.</p>
              <Button size="lg" onClick={handleConnect} disabled={isConnecting} className="bg-blue-500 hover:bg-blue-600">
                {isConnecting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Connecting...</> : <><Globe className="w-4 h-4 mr-2" />Connect Google Business</>}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      <div className="grid grid-cols-2 gap-4">
        {[{ icon: Shield, text: 'Bank-level security' }, { icon: Clock, text: '30-second setup' }, { icon: TrendingUp, text: 'Instant insights' }, { icon: Award, text: 'Google approved' }].map((benefit, i) => (
          <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
            <benefit.icon className="w-4 h-4 text-blue-500" />{benefit.text}
          </div>
        ))}
      </div>
    </div>
  );
};

// Step 2: Business Info
const Step2BusinessInfo = ({ onNext, onBack, data, updateData }) => {
  const [selectedIndustry, setSelectedIndustry] = useState(data.industry || null);
  const handleSelect = (id) => {
    setSelectedIndustry(id);
    const template = industryTemplates.find(t => t.id === id);
    updateData({ industry: id, template });
  };
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Select Your Industry</h2>
        <p className="text-slate-600">We'll apply pre-configured optimizations tailored to your business type.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto p-2">
        {industryTemplates.map((template, index) => (
          <motion.div key={template.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
            onClick={() => handleSelect(template.id)}
            className={`cursor-pointer transition-all ${selectedIndustry === template.id ? 'ring-2 ring-blue-500 rounded-xl' : ''}`}
          >
            <Card className={`h-full hover:shadow-lg transition-shadow ${selectedIndustry === template.id ? 'bg-blue-50 border-blue-200' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${template.color} flex items-center justify-center text-2xl`}>{template.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{template.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{template.setupTime} setup</p>
                    <div className="mt-2 flex items-center gap-1 text-xs text-green-600 font-medium">
                      <TrendingUp className="w-3 h-3" />{template.estimatedImpact}
                    </div>
                  </div>
                  {selectedIndustry === template.id && <CheckCircle2 className="w-6 h-6 text-blue-500" />}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      {selectedIndustry && (
        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
          <Button onClick={onNext} className="bg-blue-500 hover:bg-blue-600">Continue<ArrowRight className="w-4 h-4 ml-2" /></Button>
        </div>
      )}
    </div>
  );
};

// Step 3: Package
const Step3Package = ({ onNext, onBack, data, updateData }) => {
  const [selectedPackage, setSelectedPackage] = useState(data.package || null);
  const handleSelect = (id) => {
    setSelectedPackage(id);
    updateData({ package: id, packageDetails: packages.find(p => p.id === id) });
  };
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Choose Your Optimization Package</h2>
        <p className="text-slate-600">Select the plan that fits your growth goals.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {packages.map((pkg, index) => (
          <motion.div key={pkg.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}
            onClick={() => handleSelect(pkg.id)}
            className={`cursor-pointer transition-all ${selectedPackage === pkg.id ? 'ring-2 ring-blue-500 rounded-xl' : ''}`}
          >
            <Card className={`h-full relative overflow-hidden ${selectedPackage === pkg.id ? 'bg-blue-50 border-blue-200' : ''} ${pkg.popular ? 'border-amber-200' : ''}`}>
              {pkg.popular && <div className="absolute top-0 right-0"><Badge className="rounded-tl-none rounded-tr-xl bg-amber-500 text-white"><Star className="w-3 h-3 mr-1" />Most Popular</Badge></div>}
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">{pkg.name}</CardTitle>
                <CardDescription className="text-sm">{pkg.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">${pkg.price}</span>
                  <span className="text-slate-500">/month</span>
                </div>
                <ul className="space-y-2">
                  {pkg.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-slate-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button className={`w-full ${selectedPackage === pkg.id ? 'bg-green-500 hover:bg-green-600' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>
                  {selectedPackage === pkg.id ? <><Check className="w-4 h-4 mr-2" />Selected</> : 'Select Plan'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
        {selectedPackage && <Button onClick={onNext} className="bg-blue-500 hover:bg-blue-600">Continue<ArrowRight className="w-4 h-4 ml-2" /></Button>}
      </div>
    </div>
  );
};

// Step 4: Payment (UI only)
const Step4Payment = ({ onNext, onBack, data }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const handlePayment = async () => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsProcessing(false);
    onNext();
  };
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Complete Your Subscription</h2>
        <p className="text-slate-600">You're subscribing to {data.packageDetails?.name} for ${data.packageDetails?.price}/month</p>
      </div>
      <div className="max-w-md mx-auto">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="bg-slate-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm"><span className="text-slate-600">Plan</span><span className="font-medium">{data.packageDetails?.name}</span></div>
              <div className="border-t pt-2 flex justify-between"><span className="font-medium">Total</span><span className="font-bold text-lg">${data.packageDetails?.price}/mo</span></div>
            </div>
            <div className="space-y-4">
              <div>
                <Label>Card Number</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input placeholder="1234 5678 9012 3456" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} className="pl-10" maxLength={19} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Expiry</Label><Input placeholder="MM/YY" maxLength={5} /></div>
                <div><Label>CVC</Label><div className="relative"><Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" /><Input placeholder="123" className="pl-10" maxLength={3} type="password" /></div></div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500"><Shield className="w-4 h-4" />Secured by Stripe. Your payment info is encrypted.</div>
          </CardContent>
        </Card>
      </div>
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
        <Button onClick={handlePayment} disabled={isProcessing} className="bg-blue-500 hover:bg-blue-600">
          {isProcessing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</> : <>Complete Payment<ArrowRight className="w-4 h-4 ml-2" /></>}
        </Button>
      </div>
    </div>
  );
};

// Step 5: Launch
const Step5Launch = ({ data }) => {
  const [launchProgress, setLaunchProgress] = useState(0);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [isLaunching, setIsLaunching] = useState(true);
  const launchTasks = ['Verifying GMB connection', 'Applying industry template', 'Setting up keyword tracking', 'Configuring review monitoring', 'Initializing citation builder', 'Activating automated reports', 'Optimization complete!'];
  useEffect(() => {
    const run = async () => {
      for (let i = 0; i <= 100; i += 5) {
        setLaunchProgress(i);
        const taskIndex = Math.floor((i / 100) * launchTasks.length);
        if (taskIndex > 0) setCompletedTasks(prev => [...new Set([...prev, launchTasks[taskIndex - 1]])]);
        await new Promise(resolve => setTimeout(resolve, 150));
      }
      setIsLaunching(false);
    };
    run();
  }, []);
  return (
    <div className="space-y-6">
      <div className="text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-green-600 mb-4 shadow-xl">
          {isLaunching ? <Loader2 className="w-12 h-12 text-white animate-spin" /> : <Rocket className="w-12 h-12 text-white" />}
        </motion.div>
        <h2 className="text-2xl font-bold mb-2">{isLaunching ? 'Launching Your Optimization...' : "You're All Set! 🎉"}</h2>
        <p className="text-slate-600">{isLaunching ? 'Setting up your automated optimization system...' : 'Your local SEO optimization is now live and running!'}</p>
      </div>
      <div className="max-w-md mx-auto">
        <div className="flex justify-between text-sm text-slate-500 mb-2"><span>Setup Progress</span><span>{launchProgress}%</span></div>
        <Progress value={launchProgress} className="h-3" />
      </div>
      <div className="max-w-md mx-auto space-y-3">
        {launchTasks.map((task, index) => {
          const isCompleted = completedTasks.includes(task);
          return (
            <div key={task} className={`flex items-center gap-3 p-3 rounded-lg transition-all border ${isCompleted ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
              {isCompleted ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5 text-slate-300" />}
              <span className={`text-sm ${isCompleted ? 'text-green-700' : 'text-slate-600'}`}>{task}</span>
            </div>
          );
        })}
      </div>
      {!isLaunching && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={() => window.location.href = createPageUrl('Dashboard')} className="bg-blue-500 hover:bg-blue-600">
            Go to Dashboard<ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>
      )}
    </div>
  );
};

// Main QuickStartWizard Page
export default function QuickStartWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState({});
  const updateData = (newData) => setWizardData(prev => ({ ...prev, ...newData }));
  const handleNext = () => { if (currentStep < 5) setCurrentStep(currentStep + 1); };
  const handleBack = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };
  const stepProps = { onNext: handleNext, onBack: handleBack, data: wizardData, updateData };
  const renderStep = () => {
    switch (currentStep) {
      case 1: return <Step1Connect {...stepProps} />;
      case 2: return <Step2BusinessInfo {...stepProps} />;
      case 3: return <Step3Package {...stepProps} />;
      case 4: return <Step4Payment {...stepProps} />;
      case 5: return <Step5Launch {...stepProps} />;
      default: return null;
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <Badge className="mb-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
            <Sparkles className="w-3 h-3 mr-1" />Quick Start Wizard
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Get Optimized in 5 Minutes</h1>
          <p className="text-slate-600">Our guided setup will have you ranking higher in no time.</p>
        </motion.div>
        <StepIndicator currentStep={currentStep} />
        <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
          <Card className="shadow-xl">
            <CardContent className="p-6 md:p-8">{renderStep()}</CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}