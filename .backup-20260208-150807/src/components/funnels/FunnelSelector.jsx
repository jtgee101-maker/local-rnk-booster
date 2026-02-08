import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { 
  Zap, 
  TrendingUp, 
  Building2, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  HelpCircle,
  Clock,
  Users,
  Globe,
  Shield,
  Award
} from 'lucide-react';

const funnelOptions = [
  {
    id: 'quickstart',
    title: 'Quick Start',
    subtitle: 'Done-for-you Experience',
    description: 'Perfect for beginners. Get optimized in 5 simple steps with pre-configured templates.',
    icon: Zap,
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    features: [
      '5-step guided wizard',
      'Pre-configured industry templates',
      'One-click optimizations',
      'Automated GMB connection',
      'Basic reporting dashboard'
    ],
    timeline: '5-10 minutes setup',
    difficulty: 'Beginner',
    badge: 'Most Popular',
    recommendedFor: ['Small business owners', 'First-time users', 'Busy professionals']
  },
  {
    id: 'growth',
    title: 'Growth Mode',
    subtitle: 'Scale Your Presence',
    description: 'For businesses ready to take control. Custom campaigns, A/B testing, and advanced tracking.',
    icon: TrendingUp,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    features: [
      'Custom campaign builder',
      'A/B testing suite',
      'Review automation',
      'Citation tracking',
      'Competitor monitoring'
    ],
    timeline: 'Ongoing optimization',
    difficulty: 'Intermediate',
    badge: 'Best Value',
    recommendedFor: ['Growing businesses', 'Marketing managers', 'Multi-location brands']
  },
  {
    id: 'enterprise',
    title: 'Enterprise',
    subtitle: 'Full Control & Scale',
    description: 'Unlimited power for large organizations. White-label, API access, and dedicated support.',
    icon: Building2,
    color: 'from-violet-500 to-purple-500',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/20',
    features: [
      'Unlimited locations',
      'Full white-label branding',
      'API key management',
      'Custom integrations',
      'Dedicated account rep'
    ],
    timeline: 'Custom implementation',
    difficulty: 'Advanced',
    badge: 'Enterprise Grade',
    recommendedFor: ['Franchises', 'Agencies', 'Enterprise teams']
  }
];

const quizQuestions = [
  {
    id: 1,
    question: 'How many business locations do you manage?',
    options: [
      { value: 'quickstart', label: 'Just one location', points: { quickstart: 3, growth: 1, enterprise: 0 } },
      { value: 'growth', label: '2-10 locations', points: { quickstart: 1, growth: 3, enterprise: 1 } },
      { value: 'enterprise', label: '10+ locations', points: { quickstart: 0, growth: 1, enterprise: 3 } }
    ]
  },
  {
    id: 2,
    question: 'How comfortable are you with digital marketing tools?',
    options: [
      { value: 'quickstart', label: 'I prefer everything done for me', points: { quickstart: 3, growth: 0, enterprise: 0 } },
      { value: 'growth', label: 'I like some control and customization', points: { quickstart: 1, growth: 3, enterprise: 1 } },
      { value: 'enterprise', label: 'I want full control and advanced features', points: { quickstart: 0, growth: 1, enterprise: 3 } }
    ]
  },
  {
    id: 3,
    question: 'Do you need white-label or branded solutions?',
    options: [
      { value: 'quickstart', label: 'Not necessary', points: { quickstart: 3, growth: 1, enterprise: 0 } },
      { value: 'growth', label: 'Basic branding is fine', points: { quickstart: 1, growth: 3, enterprise: 1 } },
      { value: 'enterprise', label: 'Full white-label required', points: { quickstart: 0, growth: 1, enterprise: 3 } }
    ]
  },
  {
    id: 4,
    question: 'What\'s your primary goal?',
    options: [
      { value: 'quickstart', label: 'Get found online quickly', points: { quickstart: 3, growth: 1, enterprise: 0 } },
      { value: 'growth', label: 'Grow my customer base', points: { quickstart: 1, growth: 3, enterprise: 1 } },
      { value: 'enterprise', label: 'Scale across multiple markets', points: { quickstart: 0, growth: 1, enterprise: 3 } }
    ]
  },
  {
    id: 5,
    question: 'Do you have a team managing marketing?',
    options: [
      { value: 'quickstart', label: 'Just me', points: { quickstart: 3, growth: 0, enterprise: 0 } },
      { value: 'growth', label: 'Small team (2-5 people)', points: { quickstart: 1, growth: 3, enterprise: 1 } },
      { value: 'enterprise', label: 'Large team or agency', points: { quickstart: 0, growth: 1, enterprise: 3 } }
    ]
  }
];

const FunnelCard = ({ option, index, onSelect, isRecommended }) => {
  const Icon = option.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className="relative"
    >
      <Card className={`h-full cursor-pointer transition-all duration-300 hover:shadow-2xl ${option.borderColor} overflow-hidden group`}>
        {/* Background Gradient Effect */}
        <div className={`absolute inset-0 bg-gradient-to-br ${option.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
        
        {/* Recommended Badge */}
        {isRecommended && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-3 left-1/2 -translate-x-1/2 z-10"
          >
            <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 px-3 py-1">
              <Sparkles className="w-3 h-3 mr-1" />
              Recommended
            </Badge>
          </motion.div>
        )}
        
        {/* Badge */}
        <div className="absolute top-4 right-4">
          <Badge variant="secondary" className={option.bgColor}>
            {option.badge}
          </Badge>
        </div>

        <CardHeader className="pb-4">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${option.color} flex items-center justify-center mb-4 shadow-lg`}>
            <Icon className="w-7 h-7 text-white" />
          </div>
          <CardTitle className="text-2xl">{option.title}</CardTitle>
          <CardDescription className="text-sm font-medium text-slate-500">
            {option.subtitle}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            {option.description}
          </p>

          {/* Difficulty & Timeline */}
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {option.timeline}
            </span>
            <span className="flex items-center gap-1">
              <Award className="w-3 h-3" />
              {option.difficulty}
            </span>
          </div>

          {/* Features List */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Features</p>
            <ul className="space-y-2">
              {option.features.map((feature, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"
                >
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {feature}
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Recommended For */}
          <div className="pt-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Perfect for</p>
            <div className="flex flex-wrap gap-1">
              {option.recommendedFor.map((item, i) => (
                <Badge key={i} variant="outline" className="text-xs font-normal">
                  {item}
                </Badge>
              ))}
            </div>
          </div>

          <Button 
            onClick={() => onSelect(option.id)}
            className={`w-full mt-4 bg-gradient-to-r ${option.color} hover:opacity-90 text-white border-0`}
          >
            Get Started
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const QuizModal = ({ isOpen, onClose, onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [scores, setScores] = useState({ quickstart: 0, growth: 0, enterprise: 0 });

  const handleAnswer = (questionId, option) => {
    const newAnswers = { ...answers, [questionId]: option.value };
    setAnswers(newAnswers);
    
    // Update scores
    const newScores = { ...scores };
    Object.entries(option.points).forEach(([funnel, points]) => {
      newScores[funnel] += points;
    });
    setScores(newScores);

    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Calculate winner
      const winner = Object.entries(newScores).sort((a, b) => b[1] - a[1])[0][0];
      onComplete(winner);
      onClose();
    }
  };

  const progress = ((currentQuestion + 1) / quizQuestions.length) * 100;
  const question = quizQuestions[currentQuestion];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-500" />
            Find Your Perfect Path
          </DialogTitle>
          <DialogDescription>
            Answer {quizQuestions.length} quick questions to get a personalized recommendation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Question {currentQuestion + 1} of {quizQuestions.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Question */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-medium">{question.question}</h3>
              
              <RadioGroup className="space-y-3">
                {question.options.map((option, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div
                      onClick={() => handleAnswer(question.id, option)}
                      className="flex items-center space-x-3 p-4 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <RadioGroupItem value={option.value} id={`option-${i}`} />
                      <Label htmlFor={`option-${i}`} className="flex-1 cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  </motion.div>
                ))}
              </RadioGroup>
            </motion.div>
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const FunnelSelector = () => {
  const navigate = useNavigate();
  const [showQuiz, setShowQuiz] = useState(false);
  const [recommendedFunnel, setRecommendedFunnel] = useState(null);

  const handleSelect = (funnelId) => {
    switch (funnelId) {
      case 'quickstart':
        navigate('/funnels/quickstart');
        break;
      case 'growth':
        navigate('/funnels/growth');
        break;
      case 'enterprise':
        navigate('/funnels/enterprise');
        break;
      default:
        break;
    }
  };

  const handleQuizComplete = (funnelId) => {
    setRecommendedFunnel(funnelId);
    // Scroll to the recommended card
    setTimeout(() => {
      const element = document.getElementById(`funnel-${funnelId}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <Badge className="mb-4 bg-gradient-to-r from-blue-500 to-violet-500 text-white border-0">
            <Sparkles className="w-3 h-3 mr-1" />
            Choose Your Path
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
            How Would You Like to Grow?
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Select the pathway that matches your experience level and business goals. 
            Not sure? Take our quick quiz for a personalized recommendation.
          </p>
          
          {/* Quiz CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6"
          >
            <Button
              variant="outline"
              onClick={() => setShowQuiz(true)}
              className="gap-2"
            >
              <HelpCircle className="w-4 h-4" />
              Not sure? Take our quiz
            </Button>
          </motion.div>
        </motion.div>

        {/* Funnel Cards Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {funnelOptions.map((option, index) => (
            <div key={option.id} id={`funnel-${option.id}`}>
              <FunnelCard
                option={option}
                index={index}
                onSelect={handleSelect}
                isRecommended={recommendedFunnel === option.id}
              />
            </div>
          ))}
        </div>

        {/* Bottom Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {[
            { icon: Users, label: 'Active Users', value: '10,000+' },
            { icon: Globe, label: 'Countries', value: '45+' },
            { icon: Shield, label: 'Uptime', value: '99.9%' },
            { icon: Award, label: 'Success Rate', value: '94%' }
          ].map((stat, i) => (
            <div key={i} className="text-center p-4">
              <stat.icon className="w-6 h-6 mx-auto mb-2 text-slate-400" />
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-sm text-slate-500">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Quiz Modal */}
      <QuizModal
        isOpen={showQuiz}
        onClose={() => setShowQuiz(false)}
        onComplete={handleQuizComplete}
      />
    </div>
  );
};

export default FunnelSelector;
