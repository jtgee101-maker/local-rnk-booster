import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { 
  CheckCircle2, 
  Circle,
  ArrowRight,
  ArrowLeft,
  Building2,
  CreditCard,
  Rocket,
  MapPin,
  Briefcase,
  Sparkles,
  Loader2,
  Star,
  TrendingUp,
  Shield,
  Clock,
  Award,
  ChevronRight,
  Check,
  Lock,
  Mail,
  Phone,
  Globe
} from 'lucide-react';

// Industry templates with pre-configured optimizations
const industryTemplates = [
  {
    id: 'restaurant',
    name: 'Restaurant & Food Service',
    icon: '🍽️',
    color: 'from-orange-500 to-red-500',
    optimizations: ['Menu SEO', 'Reservation booking', 'Review generation', 'Local food keywords'],
    estimatedImpact: '+45% visibility',
    setupTime: '3 min'
  },
  {
    id: 'healthcare',
    name: 'Healthcare & Medical',
    icon: '🏥',
    color: 'from-blue-500 to-cyan-500',
    optimizations: ['HIPAA-compliant forms', 'Appointment scheduling', 'Provider bios', 'Insurance keywords'],
    estimatedImpact: '+38% visibility',
    setupTime: '4 min'
  },
  {
    id: 'legal',
    name: 'Legal Services',
    icon: '⚖️',
    color: 'from-slate-600 to-slate-800',
    optimizations: ['Case type targeting', 'Consultation booking', 'Attorney profiles', 'Legal authority content'],
    estimatedImpact: '+52% visibility',
    setupTime: '3 min'
  },
  {
    id: 'realestate',
    name: 'Real Estate',
    icon: '🏠',
    color: 'from-green-500 to-emerald-500',
    optimizations: ['Property listings', 'Virtual tours', 'Neighborhood pages', 'Buyer/seller guides'],
    estimatedImpact: '+41% visibility',
    setupTime: '4 min'
  },
  {
    id: 'automotive',
    name: 'Automotive Services',
    icon: '🚗',
    color: 'from-red-500 to-pink-500',
    optimizations: ['Service scheduling', 'Parts inventory', 'Vehicle galleries', 'Maintenance guides'],
    estimatedImpact: '+35% visibility',
    setupTime: '3 min'
  },
  {
    id: 'retail',
    name: 'Retail & E-commerce',
    icon: '🛍️',
    color: 'from-purple-500 to-violet-500',
    optimizations: ['Product SEO', 'Inventory sync', 'Local pickup', 'Seasonal promotions'],
    estimatedImpact: '+43% visibility',
    setupTime: '3 min'
  },
  {
    id: 'fitness',
    name: 'Fitness & Wellness',
    icon: '💪',
    color: 'from-yellow-500 to-orange-500',
    optimizations: ['Class scheduling', 'Membership management', 'Trainer profiles', 'Wellness content'],
    estimatedImpact: '+39% visibility',
    setupTime: '3 min'
  },
  {
    id: 'beauty',
    name: 'Beauty & Spa',
    icon: '💅',
    color: 'from-pink-500 to-rose-500',
    optimizations: ['Appointment booking', 'Service menus', 'Before/after galleries', 'Beauty tips content'],
    estimatedImpact: '+44% visibility',
    setupTime: '3 min'
  },
  {
    id: 'home_services',
    name: 'Home Services',
    icon: '🔧',
    color: 'from-amber-600 to-yellow-600',
    optimizations: ['Service areas', 'Quote requests', 'Project galleries', 'Emergency services'],
    estimatedImpact: '+48% visibility',
    setupTime: '4 min'
  },
  {
    id: 'education',
    name: 'Education & Training',
    icon: '🎓',
    color: 'from-indigo-500 to-blue-500',
    optimizations: ['Course listings', 'Enrollment forms', 'Instructor bios', 'Success stories'],
    estimatedImpact: '+36% visibility',
    setupTime: '3 min'
  }
];

// Optimization packages
const packages = [
  {
    id: 'starter',
    name: 'Starter Boost',
    price: 49,
    period: 'month',
    description: 'Essential optimization for small businesses',
    features: [
      'GMB optimization',
      '5 keyword targets',
      'Monthly reports',
      'Review monitoring'
    ],
    popular: false,
    color: 'from-slate-500 to-slate-600'
  },
  {
    id: 'growth',
    name: 'Growth Accelerator',
    price: 99,
    period: 'month',
    description: 'Comprehensive growth for ambitious businesses',
    features: [
      'Everything in Starter',
      '15 keyword targets',
      'Weekly reports',
      'Review automation',
      'Citation building',
      'Competitor tracking'
    ],
    popular: true,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'domination',
    name: 'Market Domination',
    price: 199,
    period: 'month',
    description: 'Full-scale domination of your local market',
    features: [
      'Everything in Growth',
      'Unlimited keywords',
      'Daily monitoring',
      'Content creation',
      'Social media sync',
      'Priority support',
      'Dedicated strategist'
    ],
    popular: false,
    color: 'from-violet-500 to-purple-500'
  }
];

// Step indicator component
const StepIndicator = ({ currentStep, totalSteps }) => {
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
              <motion.div
                initial={false}
                animate={{
                  scale: isActive ? 1.1 : 1,
                  backgroundColor: isActive ? '#3b82f6' : isCompleted ? '#22c55e' : '#e2e8f0'
                }}
                className={`flex flex-col items-center ${
                  isActive ? 'text-blue-500' : isCompleted ? 'text-green-500' : 'text-slate-400'
                }`}
              >
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center ${
                  isActive 
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' 
                    : isCompleted 
                      ? 'bg-green-500 text-white' 
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                }`}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" />
                  ) : (
                    <Icon className="w-5 h-5 md:w-6 md:h-6" />
                  )}
                </div>
                <span className="text-xs mt-1 hidden md:block font-medium">{step.label}</span>
              </motion.div>
              
              {index < steps.length - 1 && (
                <div className="w-8 md:w-16 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: isCompleted ? '100%' : '0%' }}
                    className="h-full bg-green-500"
                    transition={{ duration: 0.3 }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

// Animated checklist component
const AnimatedChecklist = ({ items, completedItems }) => {
  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const isCompleted = completedItems.includes(item);
        return (
          <motion.div
            key={item}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
              isCompleted 
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                : 'bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <motion.div
              initial={false}
              animate={{
                scale: isCompleted ? [1, 1.2, 1] : 1,
                rotate: isCompleted ? [0, 10, -10, 0] : 0
              }}
              transition={{ duration: 0.3 }}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <Circle className="w-5 h-5 text-slate-300" />
              )}
            </motion.div>
            <span className={`text-sm ${isCompleted ? 'text-green-700 dark:text-green-400' : 'text-slate-600 dark:text-slate-400'}`}>
              {item}
            </span>
            {isCompleted && (
              <motion.span
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                className="ml-auto text-xs text-green-600 font-medium"
              >
                Done!
              </motion.span>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

// Step 1: Connect GMB
const Step1Connect = ({ onNext, data, updateData }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const handleConnect = async () => {
    setIsConnecting(true);
    // Simulate OAuth connection
    await new Promise(resolve => setTimeout(resolve, 2000));
    updateData({ gmbConnected: true, gmbEmail: 'business@example.com' });
    toast({
      title: 'Successfully connected!',
      description: 'Your Google Business Profile has been linked.',
    });
    setIsConnecting(false);
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Connect Your Google Business Profile</h2>
        <p className="text-slate-600 dark:text-slate-400">
          Link your GMB to enable automatic optimization and tracking.
        </p>
      </div>

      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
        <CardContent className="p-6">
          {data.gmbConnected ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-4"
            >
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Connected Successfully!</h3>
                <p className="text-slate-600 dark:text-slate-400">{data.gmbEmail}</p>
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-white dark:bg-slate-800 shadow-lg flex items-center justify-center mb-4">
                <Globe className="w-10 h-10 text-blue-500" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Secure OAuth Connection</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 max-w-sm">
                We use Google's official OAuth to securely access your business profile. 
                We never store your password.
              </p>
              <Button
                size="lg"
                onClick={handleConnect}
                disabled={isConnecting}
                className="bg-blue-500 hover:bg-blue-600"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4 mr-2" />
                    Connect Google Business
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Benefits */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { icon: Shield, text: 'Bank-level security' },
          { icon: Clock, text: '30-second setup' },
          { icon: TrendingUp, text: 'Instant insights' },
          { icon: Award, text: 'Google approved' }
        ].map((benefit, i) => (
          <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
            <benefit.icon className="w-4 h-4 text-blue-500" />
            {benefit.text}
          </div>
        ))}
      </div>
    </div>
  );
};

// Step 2: Business Info
const Step2BusinessInfo = ({ onNext, onBack, data, updateData }) => {
  const [selectedIndustry, setSelectedIndustry] = useState(data.industry || null);

  const handleIndustrySelect = (industryId) => {
    setSelectedIndustry(industryId);
    const template = industryTemplates.find(t => t.id === industryId);
    updateData({ industry: industryId, template });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Select Your Industry</h2>
        <p className="text-slate-600 dark:text-slate-400">
          We'll apply pre-configured optimizations tailored to your business type.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto p-2">
        {industryTemplates.map((template, index) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => handleIndustrySelect(template.id)}
            className={`cursor-pointer transition-all ${
              selectedIndustry === template.id 
                ? 'ring-2 ring-blue-500 rounded-xl' 
                : ''
            }`}
          >
            <Card className={`h-full hover:shadow-lg transition-shadow ${
              selectedIndustry === template.id 
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200' 
                : ''
            }`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${template.color} flex items-center justify-center text-2xl`}>
                    {template.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{template.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{template.setupTime} setup</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {template.optimizations.slice(0, 2).map((opt, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {opt}
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-xs text-green-600 font-medium">
                      <TrendingUp className="w-3 h-3" />
                      {template.estimatedImpact}
                    </div>
                  </div>
                  {selectedIndustry === template.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-blue-500"
                    >
                      <CheckCircle2 className="w-6 h-6" />
                    </motion.div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {selectedIndustry && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between"
        >
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button onClick={onNext} className="bg-blue-500 hover:bg-blue-600">
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>
      )}
    </div>
  );
};

// Step 3: Select Package
const Step3Package = ({ onNext, onBack, data, updateData }) => {
  const [selectedPackage, setSelectedPackage] = useState(data.package || null);

  const handlePackageSelect = (pkgId) => {
    setSelectedPackage(pkgId);
    const pkg = packages.find(p => p.id === pkgId);
    updateData({ package: pkgId, packageDetails: pkg });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Choose Your Optimization Package</h2>
        <p className="text-slate-600 dark:text-slate-400">
          Select the plan that fits your growth goals. Upgrade or downgrade anytime.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {packages.map((pkg, index) => (
          <motion.div
            key={pkg.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => handlePackageSelect(pkg.id)}
            className={`cursor-pointer transition-all ${
              selectedPackage === pkg.id ? 'ring-2 ring-blue-500 rounded-xl' : ''
            }`}
          >
            <Card className={`h-full relative overflow-hidden ${
              selectedPackage === pkg.id 
                ? 'bg-gradient-to-b from-blue-50 to-white dark:from-blue-900/20 dark:to-slate-900 border-blue-200' 
                : ''
            } ${pkg.popular ? 'border-amber-200' : ''}`}>
              {pkg.popular && (
                <div className="absolute top-0 right-0">
                  <Badge className="rounded-tl-none rounded-br-none rounded-tr-xl rounded-bl-lg bg-amber-500 text-white">
                    <Star className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">{pkg.name}</CardTitle>
                <CardDescription className="text-sm">{pkg.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">${pkg.price}</span>
                  <span className="text-slate-500">/{pkg.period}</span>
                </div>
                
                <ul className="space-y-2">
                  {pkg.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-slate-600 dark:text-slate-400">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full ${
                    selectedPackage === pkg.id 
                      ? 'bg-green-500 hover:bg-green-600' 
                      : 'bg-gradient-to-r ' + pkg.color
                  }`}
                  variant={selectedPackage === pkg.id ? 'default' : 'outline'}
                >
                  {selectedPackage === pkg.id ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Selected
                    </>
                  ) : (
                    'Select Plan'
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        {selectedPackage && (
          <Button onClick={onNext} className="bg-blue-500 hover:bg-blue-600">
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
};

// Step 4: Payment
const Step4Payment = ({ onNext, onBack, data, updateData }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const { toast } = useToast();

  const handlePayment = async () => {
    setIsProcessing(true);
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    updateData({ paymentComplete: true });
    toast({
      title: 'Payment successful!',
      description: `Subscribed to ${data.packageDetails?.name}`,
    });
    setIsProcessing(false);
    onNext();
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Complete Your Subscription</h2>
        <p className="text-slate-600 dark:text-slate-400">
          You're subscribing to {data.packageDetails?.name} for ${data.packageDetails?.price}/month
        </p>
      </div>

      <div className="max-w-md mx-auto">
        <Card>
          <CardContent className="p-6 space-y-4">
            {/* Order Summary */}
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Plan</span>
                <span className="font-medium">{data.packageDetails?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Industry Template</span>
                <span className="font-medium">{data.template?.name}</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-medium">Total</span>
                <span className="font-bold text-lg">${data.packageDetails?.price}/mo</span>
              </div>
            </div>

            {/* Card Form */}
            <div className="space-y-4">
              <div>
                <Label>Card Number</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    className="pl-10"
                    maxLength={19}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Expiry</Label>
                  <Input
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    maxLength={5}
                  />
                </div>
                <div>
                  <Label>CVC</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="123"
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value)}
                      className="pl-10"
                      maxLength={3}
                      type="password"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Shield className="w-4 h-4" />
              Secured by Stripe. Your payment info is encrypted.
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button 
          onClick={handlePayment}
          disabled={isProcessing || cardNumber.length < 16}
          className="bg-blue-500 hover:bg-blue-600"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Complete Payment
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

// Step 5: Launch
const Step5Launch = ({ data }) => {
  const navigate = useNavigate();
  const [launchProgress, setLaunchProgress] = useState(0);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [isLaunching, setIsLaunching] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);

  const launchTasks = [
    'Verifying GMB connection',
    'Applying industry template',
    'Setting up keyword tracking',
    'Configuring review monitoring',
    'Initializing citation builder',
    'Activating automated reports',
    'Optimization complete!'
  ];

  useEffect(() => {
    const runLaunch = async () => {
      for (let i = 0; i <= 100; i += 5) {
        setLaunchProgress(i);
        
        // Mark tasks as completed based on progress
        const taskIndex = Math.floor((i / 100) * launchTasks.length);
        if (taskIndex > 0 && !completedTasks.includes(launchTasks[taskIndex - 1])) {
          setCompletedTasks(prev => [...prev, launchTasks[taskIndex - 1]]);
        }
        
        await new Promise(resolve => setTimeout(resolve, 150));
      }
      
      setIsLaunching(false);
      setShowConfetti(true);
    };

    runLaunch();
  }, []);

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-green-600 mb-4 shadow-xl shadow-green-500/30"
        >
          {isLaunching ? (
            <Loader2 className="w-12 h-12 text-white animate-spin" />
          ) : (
            <Rocket className="w-12 h-12 text-white" />
          )}
        </motion.div>
        
        <h2 className="text-2xl font-bold mb-2">
          {isLaunching ? 'Launching Your Optimization...' : 'You\'re All Set! 🎉'}
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          {isLaunching 
            ? 'Setting up your automated optimization system...' 
            : 'Your local SEO optimization is now live and running!'}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="max-w-md mx-auto">
        <div className="flex justify-between text-sm text-slate-500 mb-2">
          <span>Setup Progress</span>
          <span>{launchProgress}%</span>
        </div>
        <Progress value={launchProgress} className="h-3" />
      </div>

      {/* Animated Checklist */}
      <div className="max-w-md mx-auto">
        <AnimatedChecklist items={launchTasks} completedItems={completedTasks} />
      </div>

      {/* Stats Preview */}
      {!isLaunching && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-3 gap-4 max-w-md mx-auto"
        >
          {[
            { label: 'Keywords', value: data.packageDetails?.id === 'starter' ? '5' : data.packageDetails?.id === 'growth' ? '15' : '∞', icon: Target },
            { label: 'Visibility', value: '+45%', icon: TrendingUp },
            { label: 'Reports', value: data.packageDetails?.id === 'starter' ? 'Monthly' : 'Weekly', icon: Clock }
          ].map((stat, i) => (
            <div key={i} className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <stat.icon className="w-5 h-5 mx-auto mb-1 text-blue-500" />
              <div className="text-xl font-bold">{stat.value}</div>
              <div className="text-xs text-slate-500">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Action Buttons */}
      {!isLaunching && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button onClick={handleGoToDashboard} className="bg-blue-500 hover:bg-blue-600">
            Go to Dashboard
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button variant="outline" onClick={() => window.open('/help', '_blank')}>
            View Getting Started Guide
          </Button>
        </motion.div>
      )}
    </div>
  );
};

// Import Target icon for Step5
import { Target } from 'lucide-react';

// Main QuickStartWizard Component
const QuickStartWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState({});

  const updateData = (newData) => {
    setWizardData(prev => ({ ...prev, ...newData }));
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep = () => {
    const stepProps = {
      onNext: handleNext,
      onBack: handleBack,
      data: wizardData,
      updateData
    };

    switch (currentStep) {
      case 1:
        return <Step1Connect {...stepProps} />;
      case 2:
        return <Step2BusinessInfo {...stepProps} />;
      case 3:
        return <Step3Package {...stepProps} />;
      case 4:
        return <Step4Payment {...stepProps} />;
      case 5:
        return <Step5Launch {...stepProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Badge className="mb-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
            <Sparkles className="w-3 h-3 mr-1" />
            Quick Start Wizard
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Get Optimized in 5 Minutes
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Our guided setup will have you ranking higher in no time.
          </p>
        </motion.div>

        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} totalSteps={5} />

        {/* Main Content Card */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="shadow-xl">
            <CardContent className="p-6 md:p-8">
              {renderStep()}
            </CardContent>
          </Card>
        </motion.div>

        {/* Help Text */}
        <div className="text-center mt-6 text-sm text-slate-500">
          Need help?{' '}
          <button className="text-blue-500 hover:underline">
            Chat with our support team
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickStartWizard;
