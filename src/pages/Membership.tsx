import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  CreditCard,
  CheckCircle,
  Calendar,
  Receipt,
  Shield,
  ArrowRight,
  Download,
  Clock,
  Zap,
} from 'lucide-react';

const PLANS = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: 149,
    interval: 'month',
    desc: 'Billed monthly',
    popular: false,
  },
  {
    id: 'annual',
    name: 'Annual',
    price: 1490,
    interval: 'year',
    desc: 'Save $298/year',
    popular: true,
  },
];

const MOCK_INVOICES = [
  { id: 'INV-2026-03', date: '2026-03-01', amount: 149, status: 'paid' },
  { id: 'INV-2026-02', date: '2026-02-01', amount: 149, status: 'paid' },
  { id: 'INV-2026-01', date: '2026-01-01', amount: 149, status: 'paid' },
  { id: 'INV-2025-12', date: '2025-12-01', amount: 149, status: 'paid' },
  { id: 'INV-2025-11', date: '2025-11-01', amount: 149, status: 'paid' },
];

export default function Membership() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [processing, setProcessing] = useState(false);

  const handlePayment = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      toast({
        title: 'Payment Successful',
        description: 'Your membership has been renewed. Thank you, brother!',
      });
    }, 1500);
  };

  const handleUpdatePayment = () => {
    toast({
      title: 'Stripe Integration',
      description: 'Payment method management will be connected to Stripe in the next phase.',
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 sm:space-y-10 max-w-4xl">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold tracking-tight text-primary">
            Membership & Billing
          </h1>
          <p className="text-base sm:text-lg font-body text-muted-foreground">
            Manage your Iron Forums membership, dues, and payment history
          </p>
        </div>

        {/* Current Status */}
        <Card>
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-score-high/15 flex items-center justify-center shrink-0">
                  <CheckCircle className="h-7 w-7 text-score-high" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-heading font-bold">Active Member</h2>
                    <Badge className="bg-score-high/20 text-score-high font-body font-semibold border-0 px-3 py-0.5">
                      Active
                    </Badge>
                  </div>
                  <p className="text-base font-body text-muted-foreground mt-0.5">
                    Monthly Plan · $149/month · Next billing: April 1, 2026
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="font-body font-semibold" onClick={handleUpdatePayment}>
                  <CreditCard className="h-4 w-4 mr-1.5" /> Update Payment
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plans */}
        <div>
          <h2 className="text-xl sm:text-2xl font-heading font-bold mb-4">Choose Your Plan</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PLANS.map((plan) => (
              <Card
                key={plan.id}
                className={`cursor-pointer transition-all duration-200 ${
                  selectedPlan === plan.id
                    ? 'border-2 border-secondary shadow-md'
                    : 'border hover:border-secondary/40 hover:shadow-sm'
                } ${plan.popular ? 'relative' : ''}`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-secondary text-secondary-foreground font-body font-bold text-xs px-3 py-0.5 shadow-sm">
                      <Zap className="h-3 w-3 mr-1" /> Best Value
                    </Badge>
                  </div>
                )}
                <CardContent className="p-6 sm:p-8 text-center">
                  <h3 className="text-xl font-heading font-bold">{plan.name}</h3>
                  <div className="mt-3">
                    <span className="text-4xl sm:text-5xl font-heading font-bold text-primary">
                      ${plan.price}
                    </span>
                    <span className="text-base font-body text-muted-foreground">/{plan.interval}</span>
                  </div>
                  <p className="text-sm font-body text-muted-foreground mt-2">{plan.desc}</p>
                  <div className="mt-5 space-y-2.5 text-left">
                    {[
                      'Monthly Snapshot™ Assessment',
                      'AI Consultant Access',
                      'Chapter Meetings & Events',
                      'Brotherhood Community',
                      '1-on-1 Mentor Sessions',
                    ].map((feature) => (
                      <div key={feature} className="flex items-center gap-2.5">
                        <CheckCircle className="h-4 w-4 text-score-high shrink-0" />
                        <span className="text-sm font-body">{feature}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    className={`w-full mt-6 h-12 text-base font-heading font-bold ${
                      selectedPlan === plan.id ? '' : 'variant-outline'
                    }`}
                    variant={selectedPlan === plan.id ? 'default' : 'outline'}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPlan(plan.id);
                      handlePayment();
                    }}
                    disabled={processing}
                  >
                    {processing && selectedPlan === plan.id ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </div>
                    ) : selectedPlan === plan.id ? (
                      <>
                        <CreditCard className="h-5 w-5 mr-2" /> Pay Now
                      </>
                    ) : (
                      'Select Plan'
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Payment Method */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 font-heading text-xl sm:text-2xl">
              <CreditCard className="h-5 w-5 text-secondary" /> Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
              <div className="flex items-center gap-4">
                <div className="h-10 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="font-heading font-bold text-sm text-primary">VISA</span>
                </div>
                <div>
                  <p className="font-body font-semibold">Visa ending in 4242</p>
                  <p className="text-sm font-body text-muted-foreground">Expires 12/2028</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="font-body font-semibold text-primary" onClick={handleUpdatePayment}>
                Change
              </Button>
            </div>
            <div className="flex items-center gap-2 mt-3 px-1">
              <Shield className="h-4 w-4 text-muted-foreground/60" />
              <p className="text-xs font-body text-muted-foreground/60">
                Payments are securely processed through Stripe. Your card details are never stored on our servers.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Billing History */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 font-heading text-xl sm:text-2xl">
                <Receipt className="h-5 w-5 text-secondary" /> Billing History
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {MOCK_INVOICES.map((invoice, i) => (
                <div
                  key={invoice.id}
                  className={`flex items-center justify-between py-3.5 ${
                    i < MOCK_INVOICES.length - 1 ? 'border-b border-border/40' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Calendar className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-body font-semibold text-sm sm:text-base">
                        {new Date(invoice.date).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="text-xs font-body text-muted-foreground">{invoice.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                    <span className="font-heading font-bold text-base sm:text-lg">${invoice.amount}</span>
                    <Badge
                      className="bg-score-high/15 text-score-high font-body text-xs font-semibold border-0 px-2.5 py-0.5"
                    >
                      Paid
                    </Badge>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => toast({ title: 'Download', description: `Downloading ${invoice.id}...` })}>
                      <Download className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Help */}
        <Card className="bg-primary/5 border-primary/10">
          <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-heading font-bold text-lg">Need help with billing?</h3>
              <p className="text-sm font-body text-muted-foreground mt-0.5">
                Contact your chapter facilitator or reach out to Iron Forums HQ for billing questions, plan changes, or membership holds.
              </p>
            </div>
            <Button variant="outline" className="font-heading font-semibold shrink-0" onClick={() => toast({ title: 'Support', description: 'Support contact will be available soon.' })}>
              Contact Support <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
