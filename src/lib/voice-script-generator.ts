import { PredictionResult } from './ml-predictor';
import { AutomateFinancialForecastingOutput } from '@/ai/flows/automate-financial-forecasting';

export interface VoiceScriptOptions {
  tone: 'professional' | 'casual' | 'enthusiastic' | 'analytical';
  detailLevel: 'summary' | 'detailed' | 'comprehensive';
  includeScenarios: boolean;
  includeRiskFactors: boolean;
  includeRecommendations: boolean;
}

export class VoiceScriptGenerator {
  /**
   * Generate a dynamic voice script for forecast explanation
   */
  static generateScript(
    forecastData?: AutomateFinancialForecastingOutput,
    mlPredictions?: PredictionResult[],
    options: VoiceScriptOptions = {
      tone: 'professional',
      detailLevel: 'detailed',
      includeScenarios: true,
      includeRiskFactors: true,
      includeRecommendations: true
    }
  ): string {
    const script = new VoiceScriptBuilder(options);
    
    // Introduction
    script.addIntroduction();
    
    // Forecast overview
    if (forecastData) {
      script.addForecastOverview(forecastData);
    }
    
    // ML predictions analysis
    if (mlPredictions && mlPredictions.length > 0) {
      script.addMLPredictions(mlPredictions, options);
    }
    
    // Scenarios analysis
    if (options.includeScenarios && mlPredictions?.[0]?.scenarios) {
      script.addScenariosAnalysis(mlPredictions[0].scenarios);
    }
    
    // Risk factors
    if (options.includeRiskFactors && mlPredictions?.[0]?.riskFactors) {
      script.addRiskFactors(mlPredictions[0].riskFactors);
    }
    
    // Recommendations
    if (options.includeRecommendations) {
      script.addRecommendations(mlPredictions);
    }
    
    // Conclusion
    script.addConclusion();
    
    return script.build();
  }

  /**
   * Generate a quick summary script
   */
  static generateQuickSummary(
    forecastData?: AutomateFinancialForecastingOutput,
    mlPredictions?: PredictionResult[]
  ): string {
    return this.generateScript(forecastData, mlPredictions, {
      tone: 'casual',
      detailLevel: 'summary',
      includeScenarios: false,
      includeRiskFactors: false,
      includeRecommendations: false
    });
  }

  /**
   * Generate a comprehensive analysis script
   */
  static generateComprehensiveAnalysis(
    forecastData?: AutomateFinancialForecastingOutput,
    mlPredictions?: PredictionResult[]
  ): string {
    return this.generateScript(forecastData, mlPredictions, {
      tone: 'analytical',
      detailLevel: 'comprehensive',
      includeScenarios: true,
      includeRiskFactors: true,
      includeRecommendations: true
    });
  }
}

class VoiceScriptBuilder {
  private script: string[] = [];
  private options: VoiceScriptOptions;

  constructor(options: VoiceScriptOptions) {
    this.options = options;
  }

  addIntroduction(): void {
    const greetings = {
      professional: "Welcome to your comprehensive financial forecast analysis.",
      casual: "Hey there! Let me walk you through your financial forecast.",
      enthusiastic: "Exciting news! I've got your financial forecast ready to share!",
      analytical: "Beginning comprehensive financial forecast analysis."
    };

    this.script.push(greetings[this.options.tone]);
    this.script.push("I'll break down the key insights and projections for your business.");
  }

  addForecastOverview(forecastData: AutomateFinancialForecastingOutput): void {
    this.script.push("Let's start with your main forecast.");
    
    if (forecastData.explanation) {
      this.script.push(forecastData.explanation);
    }

    // Parse forecast table for key metrics
    const forecastLines = forecastData.forecast.split('\n').filter(line => line.includes('|'));
    if (forecastLines.length > 1) {
      const headers = forecastLines[0].split('|').map(h => h.trim()).filter(h => h);
      const dataLines = forecastLines.slice(1);
      
      if (dataLines.length > 0) {
        const firstMonthData = dataLines[0].split('|').map(d => d.trim()).filter(d => d);
        
        if (firstMonthData.length > 1) {
          this.script.push(`For the first month, you're looking at approximately ${firstMonthData[1]} in revenue.`);
        }
        
        if (dataLines.length > 1) {
          const lastMonthData = dataLines[dataLines.length - 1].split('|').map(d => d.trim()).filter(d => d);
          if (lastMonthData.length > 1) {
            this.script.push(`By the end of the forecast period, we project ${lastMonthData[1]} in revenue.`);
          }
        }
      }
    }
  }

  addMLPredictions(mlPredictions: PredictionResult[], options: VoiceScriptOptions): void {
    this.script.push("Now, let me share what our advanced machine learning models are telling us.");
    
    const firstPrediction = mlPredictions[0];
    const lastPrediction = mlPredictions[mlPredictions.length - 1];
    
    // Revenue analysis
    const revenueGrowth = ((lastPrediction.revenue - firstPrediction.revenue) / firstPrediction.revenue) * 100;
    this.script.push(`Starting with ${firstPrediction.revenue.toLocaleString()} in revenue, we're projecting growth to ${lastPrediction.revenue.toLocaleString()} by the end of the period.`);
    
    if (revenueGrowth > 0) {
      this.script.push(`That represents a ${revenueGrowth.toFixed(1)} percent growth rate.`);
    } else {
      this.script.push(`That represents a ${Math.abs(revenueGrowth).toFixed(1)} percent decline.`);
    }
    
    // Customer analysis
    const customerGrowth = ((lastPrediction.customers - firstPrediction.customers) / firstPrediction.customers) * 100;
    this.script.push(`On the customer side, you're starting with ${firstPrediction.customers.toLocaleString()} customers and projecting to reach ${lastPrediction.customers.toLocaleString()} customers.`);
    
    if (customerGrowth > 0) {
      this.script.push(`That's a ${customerGrowth.toFixed(1)} percent increase in your customer base.`);
    }
    
    // Confidence analysis
    const avgConfidence = mlPredictions.reduce((sum, p) => sum + p.confidence, 0) / mlPredictions.length;
    this.script.push(`The average confidence level across all predictions is ${avgConfidence.toFixed(0)} percent.`);
    
    if (avgConfidence >= 80) {
      this.script.push("This indicates high confidence in our projections.");
    } else if (avgConfidence >= 60) {
      this.script.push("This indicates moderate confidence with some uncertainty.");
    } else {
      this.script.push("This indicates lower confidence, suggesting higher uncertainty in the projections.");
    }
  }

  addScenariosAnalysis(scenarios: any): void {
    this.script.push("Let me break down the different scenarios for you.");
    
    this.script.push(`In the optimistic scenario, you could see ${scenarios.optimistic.revenue.toLocaleString()} in revenue with ${scenarios.optimistic.customers.toLocaleString()} customers.`);
    this.script.push(`The realistic scenario projects ${scenarios.realistic.revenue.toLocaleString()} in revenue with ${scenarios.realistic.customers.toLocaleString()} customers.`);
    this.script.push(`And in the pessimistic scenario, you might see ${scenarios.pessimistic.revenue.toLocaleString()} in revenue with ${scenarios.pessimistic.customers.toLocaleString()} customers.`);
    
    const optimisticGrowth = ((scenarios.optimistic.revenue - scenarios.realistic.revenue) / scenarios.realistic.revenue) * 100;
    const pessimisticDecline = ((scenarios.realistic.revenue - scenarios.pessimistic.revenue) / scenarios.realistic.revenue) * 100;
    
    this.script.push(`The optimistic scenario shows ${optimisticGrowth.toFixed(1)} percent higher revenue than the realistic scenario.`);
    this.script.push(`The pessimistic scenario shows ${pessimisticDecline.toFixed(1)} percent lower revenue than the realistic scenario.`);
  }

  addRiskFactors(riskFactors: string[]): void {
    if (riskFactors.length === 0) return;
    
    this.script.push("Now, let's discuss the key risk factors that could impact these projections.");
    
    riskFactors.slice(0, 3).forEach((risk, index) => {
      this.script.push(`${index + 1}. ${risk}`);
    });
    
    if (riskFactors.length > 3) {
      this.script.push(`And ${riskFactors.length - 3} additional risk factors that you should be aware of.`);
    }
  }

  addRecommendations(mlPredictions?: PredictionResult[]): void {
    this.script.push("Based on this analysis, here are my recommendations:");
    
    if (mlPredictions && mlPredictions.length > 0) {
      const avgConfidence = mlPredictions.reduce((sum, p) => sum + p.confidence, 0) / mlPredictions.length;
      
      if (avgConfidence < 70) {
        this.script.push("First, consider collecting more historical data to improve prediction accuracy.");
      }
      
      if (mlPredictions[0].riskFactors && mlPredictions[0].riskFactors.length > 0) {
        this.script.push("Second, develop mitigation strategies for the identified risk factors.");
      }
      
      this.script.push("Third, monitor your actual performance against these projections monthly.");
      this.script.push("Fourth, be prepared to adjust your strategy based on market conditions.");
    }
  }

  addConclusion(): void {
    const conclusions = {
      professional: "This concludes your financial forecast analysis. Remember that all projections are estimates based on current data and assumptions.",
      casual: "That's a wrap on your forecast! Keep in mind these are just projections, so stay flexible.",
      enthusiastic: "And there you have it! Your complete financial forecast. Remember, these are projections, so stay agile and ready to adapt!",
      analytical: "Analysis complete. Note that all projections are statistical estimates subject to market variability and data quality."
    };

    this.script.push(conclusions[this.options.tone]);
    this.script.push("Thank you for using our financial forecasting platform.");
  }

  build(): string {
    return this.script.join(' ');
  }
}
