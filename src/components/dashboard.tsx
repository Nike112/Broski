
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { useFinancialStore, type FinancialInputs } from '@/lib/store';
import { useEffect, useMemo, useState } from 'react';
import { ForecastTable } from './forecast-table';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, Trash, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"


const formSchema = z.object({
  // Large Customers
  largeCustomers: z.coerce.number().min(0).optional(),
  revPerLargeCustomer: z.coerce.number().min(0).default(16500),
  salesExecutives: z.coerce.number().min(0).optional(),
  salesExecutivesAddedPerMonth: z.coerce.number().min(0).default(1),
  salesConversionPerExec: z.coerce.number().min(0).default(1.5),
  avgSalesCycleMonths: z.coerce.number().min(0).default(3),
  rampUpPeriodMonths: z.coerce.number().min(0).default(3),
  largeCustomerChurn: z.coerce.number().min(0).max(100).default(10),
  largeCustomerGrossMargin: z.coerce.number().min(0).max(100).default(70),

  // Small-Medium Customers
  smallMediumCustomers: z.coerce.number().min(0).optional(),
  revPerSmallMediumCustomer: z.coerce.number().min(0).default(3000),
  marketingSpend: z.coerce.number().min(0).optional(),
  cac: z.coerce.number().min(0).default(1500),
  conversionRate: z.coerce.number().min(0).max(100).default(45),
  smCustomerChurn: z.coerce.number().min(0).max(100).default(2),
  smCustomerGrossMargin: z.coerce.number().min(0).max(100).default(70),

  // Company-wide
  operatingExpenses: z.coerce.number().min(0).optional(),
});


type DashboardProps = {
  onProceedToChat: () => void;
};

export function Dashboard({ onProceedToChat }: DashboardProps) {
  const { inputs, setInputs, clearInputs, hasBeenSaved, setHasBeenSaved } = useFinancialStore();
  const { toast } = useToast();
  const [isProceedEnabled, setIsProceedEnabled] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      largeCustomers: undefined,
      revPerLargeCustomer: 16500,
      salesExecutives: undefined,
      salesExecutivesAddedPerMonth: 1,
      salesConversionPerExec: 1.5,
      avgSalesCycleMonths: 3,
      rampUpPeriodMonths: 3,
      largeCustomerChurn: 10,
      largeCustomerGrossMargin: 70,
      smallMediumCustomers: undefined,
      revPerSmallMediumCustomer: 3000,
      marketingSpend: undefined,
      cac: 1500,
      conversionRate: 45,
      smCustomerChurn: 2,
      smCustomerGrossMargin: 70,
      operatingExpenses: undefined,
    },
  });

  useEffect(() => {
    if (inputs) {
      form.reset(inputs);
    }
  }, [inputs, form]);

  useEffect(() => {
    // Safely access hasBeenSaved on the client side
    setIsProceedEnabled(hasBeenSaved);
  }, [hasBeenSaved]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    setInputs(values);
    setHasBeenSaved(true);
    toast({
      title: 'Inputs Saved',
      description: 'Your financial inputs have been saved for this session.',
    });
  }

  const handleClear = () => {
    form.reset({
      largeCustomers: undefined,
      revPerLargeCustomer: 16500,
      salesExecutives: undefined,
      salesExecutivesAddedPerMonth: 1,
      salesConversionPerExec: 1.5,
      avgSalesCycleMonths: 3,
      rampUpPeriodMonths: 3,
      largeCustomerChurn: 10,
      largeCustomerGrossMargin: 70,
      smallMediumCustomers: undefined,
      revPerSmallMediumCustomer: 3000,
      marketingSpend: undefined,
      cac: 1500,
      conversionRate: 45,
      smCustomerChurn: 2,
      smCustomerGrossMargin: 70,
      operatingExpenses: undefined,
    });
    clearInputs();
    toast({
      title: 'Inputs Cleared',
      description: 'All fields have been reset to their default values.',
    });
  };

  const watchedValues = form.watch();

  const previewData = useMemo(() => {
    const {
      largeCustomers = 0,
      revPerLargeCustomer = 0,
      smallMediumCustomers = 0,
      revPerSmallMediumCustomer = 0,
    } = watchedValues;

    const largeCustRevenue = largeCustomers * revPerLargeCustomer;
    const smCustRevenue = smallMediumCustomers * revPerSmallMediumCustomer;
    const totalRevenue = largeCustRevenue + smCustRevenue;

    const headers = ['Metric', 'Value'];
    const rows = [
      ['Paying Large Customers', largeCustomers.toString()],
      ['Paying Small/Medium Customers', smallMediumCustomers.toString()],
      ['Preliminary Large Customer Revenue', `$${largeCustRevenue.toLocaleString()}`],
      [
        'Preliminary Small/Medium Customer Revenue',
        `$${smCustRevenue.toLocaleString()}`,
      ],
      ['Total Preliminary Revenue', `$${totalRevenue.toLocaleString()}`],
    ];

    const tableString = `| ${headers.join(' | ')} |\n|${headers.map(() => '---').join('|')}|\n${rows.map(row => `| ${row.join(' | ')} |`).join('\n')}`;

    return tableString;
  }, [watchedValues]);

  const renderTooltip = (text: string) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className="w-4 h-4 text-muted-foreground cursor-pointer ml-2" />
      </TooltipTrigger>
      <TooltipContent>
        <p>{text}</p>
      </TooltipContent>
    </Tooltip>
  );

  return (
    <div className="container mx-auto p-4 md:p-8">
    <TooltipProvider>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Large Customers Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Large Customers (Enterprise Sales)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                   <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="largeCustomers"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center">
                              Starting Large Customers
                              {renderTooltip("Initial number of paying large customers.")}
                            </FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="e.g., 10" {...field} value={field.value ?? ''}/>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="revPerLargeCustomer"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center">
                              Revenue per Large Customer ($/mo)
                               {renderTooltip("Monthly license fee per large customer.")}
                            </FormLabel>
                            <FormControl>
                              <Input type="number" {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                     <FormField
                        control={form.control}
                        name="salesExecutives"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center">
                                Starting Sales Executives
                                {renderTooltip("Initial number of sales executives.")}
                            </FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="e.g., 5" {...field} value={field.value ?? ''}/>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                       <FormField
                        control={form.control}
                        name="salesExecutivesAddedPerMonth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center">
                                Sales Execs Added per Month
                                {renderTooltip("Number of new sales executives hired each month.")}
                            </FormLabel>
                            <FormControl>
                              <Input type="number" {...field} value={field.value ?? ''}/>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                  </div>
                   <div className="grid md:grid-cols-3 gap-6">
                      <FormField
                        control={form.control}
                        name="salesConversionPerExec"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center">
                              Conversion per Exec/Month
                              {renderTooltip("Number of new customers a single sales executive can sign per month.")}
                            </FormLabel>
                            <FormControl>
                              <Input type="number" step="0.1" {...field} value={field.value ?? ''}/>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="avgSalesCycleMonths"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center">
                              Sales Cycle (Months)
                               {renderTooltip("Average time in months to close a deal with a large customer.")}
                            </FormLabel>
                            <FormControl>
                              <Input type="number" {...field} value={field.value ?? ''}/>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="rampUpPeriodMonths"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center">
                              Ramp-Up (Months)
                              {renderTooltip("Time for a new sales exec to become fully productive.")}
                            </FormLabel>
                            <FormControl>
                              <Input type="number" {...field} value={field.value ?? ''}/>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                   </div>
                   <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="largeCustomerChurn"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center">Annual Churn Rate (%) - {field.value}% {renderTooltip("Percentage of large customers who cancel their subscription per year.")}</FormLabel>
                            <FormControl>
                              <Slider min={0} max={100} step={1} onValueChange={(vals) => field.onChange(vals[0])} value={[field.value ?? 0]} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="largeCustomerGrossMargin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center">Gross Margin Rate (%) - {field.value}% {renderTooltip("Percentage of revenue left after subtracting cost of goods sold (COGS).")}</FormLabel>
                            <FormControl>
                              <Slider min={0} max={100} step={1} onValueChange={(vals) => field.onChange(vals[0])} value={[field.value ?? 0]} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                   </div>
                </CardContent>
              </Card>

              {/* Small & Medium Customers Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Small & Medium Customers (Marketing-Led)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="smallMediumCustomers"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center">Starting S/M Customers {renderTooltip("Initial number of paying small/medium customers.")}</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="e.g., 200" {...field} value={field.value ?? ''}/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="revPerSmallMediumCustomer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center">Revenue per S/M Customer ($/mo) {renderTooltip("Average monthly revenue per small/medium customer (ARPU).")}</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} value={field.value ?? ''}/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                   <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="marketingSpend"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center">Monthly Marketing Spend ($) {renderTooltip("Total amount spent on marketing activities per month.")}</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="e.g., 10000" {...field} value={field.value ?? ''}/>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                       <FormField
                          control={form.control}
                          name="cac"
                          render={({ field }) => (
                          <FormItem>
                              <FormLabel className="flex items-center">Customer Acquisition Cost (CAC) ($) {renderTooltip("The cost to acquire one new small/medium customer.")}</FormLabel>
                              <FormControl>
                              <Input type="number" {...field} value={field.value ?? ''}/>
                              </FormControl>
                              <FormMessage />
                          </FormItem>
                          )}
                      />
                   </div>
                    <FormField
                      control={form.control}
                      name="conversionRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center">Conversion Rate (Demo to Paying) (%) - {field.value}% {renderTooltip("Percentage of demo users who become paying customers.")}</FormLabel>
                          <FormControl>
                            <Slider min={0} max={100} step={1} onValueChange={(vals) => field.onChange(vals[0])} value={[field.value ?? 0]} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid md:grid-cols-2 gap-6">
                       <FormField
                        control={form.control}
                        name="smCustomerChurn"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center">Monthly Churn Rate (%) - {field.value}% {renderTooltip("Percentage of S/M customers who cancel their subscription per month.")}</FormLabel>
                            <FormControl>
                              <Slider min={0} max={100} step={0.1} onValueChange={(vals) => field.onChange(vals[0])} value={[field.value ?? 0]} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                       <FormField
                        control={form.control}
                        name="smCustomerGrossMargin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center">Gross Margin Rate (%) - {field.value}% {renderTooltip("Percentage of revenue left after subtracting COGS for S/M customers.")}</FormLabel>
                            <FormControl>
                              <Slider min={0} max={100} step={1} onValueChange={(vals) => field.onChange(vals[0])} value={[field.value ?? 0]} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                </CardContent>
              </Card>

              {/* Company-Wide Card */}
              <Card>
                 <CardHeader>
                    <CardTitle>Company-Wide Assumptions</CardTitle>
                    <CardDescription>
                      Set high-level financial parameters and benchmarks for the entire company.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                     <FormField
                        control={form.control}
                        name="operatingExpenses"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center">Operating Expenses ($/mo) {renderTooltip("Monthly fixed costs like salaries (non-sales), rent, and utilities.")}</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="e.g. 50000" {...field} value={field.value ?? ''}/>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                  </CardContent>
              </Card>
            </div>

            {/* Preview Card */}
            <div className="space-y-6">
              <Card className="lg:sticky lg:top-8">
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <ForecastTable data={previewData} />
                   <FormDescription className="mt-4">
                    This is a preliminary calculation based on the starting customer numbers provided.
                  </FormDescription>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div className="flex justify-start gap-4 sticky bottom-0 bg-background/80 backdrop-blur-sm py-4">
            <Button type="submit">Save Inputs</Button>
            <Button type="button" variant="outline" onClick={handleClear}>
              <Trash className="w-4 h-4 mr-2" />
              Clear Inputs
            </Button>
             <Button
              type="button"
              variant="secondary"
              onClick={onProceedToChat}
              disabled={!isProceedEnabled}
            >
              Ask Chatbot
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </Form>
      </TooltipProvider>
    </div>
  );
}
