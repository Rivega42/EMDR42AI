/**
 * EMDR Session Conductor Test Page
 * Complete demonstration of the Revolutionary AI-driven EMDR therapy system
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Heart, Eye, Mic, Activity, Settings, BookOpen, BarChart3 } from "lucide-react";

import EMDRConductorDemo from "@/components/EMDRConductorDemo";
import { useAuth } from "@/hooks/useAuth";

export default function EMDRConductorTestPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("demo");

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Authentication Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Please log in to access the EMDR Session Conductor
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Revolutionary EMDR Session Conductor
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            AI-Powered Autonomous EMDR Therapy System
          </p>
          
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Brain className="w-3 h-3" />
              AI Therapist (GPT-5)
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Activity className="w-3 h-3" />
              98 Emotion Recognition
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              3D Bilateral Stimulation
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Mic className="w-3 h-3" />
              Voice AI Integration
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Heart className="w-3 h-3" />
              Adaptive Logic
            </Badge>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="demo" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Live Demo
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Features
            </TabsTrigger>
            <TabsTrigger value="algorithm" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Algorithm
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="demo" className="mt-6">
            <EMDRConductorDemo />
          </TabsContent>

          <TabsContent value="features" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-blue-500" />
                    AI Therapist Integration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• GPT-5 powered therapeutic guidance</li>
                    <li>• Context-aware conversation</li>
                    <li>• Phase-specific prompts</li>
                    <li>• Crisis detection and response</li>
                    <li>• Multilingual support (RU/EN)</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-500" />
                    Emotion Recognition (98 Affects)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• Face + voice multimodal analysis</li>
                    <li>• Real-time arousal/valence tracking</li>
                    <li>• 98 discrete emotions</li>
                    <li>• Adaptive threshold adjustment</li>
                    <li>• Emotion-based interventions</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-purple-500" />
                    3D Bilateral Stimulation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• 10 advanced 3D patterns</li>
                    <li>• Emotion-adaptive speed control</li>
                    <li>• Therapeutic audio integration</li>
                    <li>• Haptic feedback support</li>
                    <li>• Performance optimization</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mic className="w-5 h-5 text-orange-500" />
                    Voice AI Therapist
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• ElevenLabs voice synthesis</li>
                    <li>• Emotional voice adaptation</li>
                    <li>• Real-time conversation</li>
                    <li>• Interruption handling</li>
                    <li>• Therapeutic voice profiles</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    Adaptive Logic Engine
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• High anxiety - safe place</li>
                    <li>• Dissociation - grounding</li>
                    <li>• Overwhelm - pause & breathe</li>
                    <li>• Low engagement - stimulate</li>
                    <li>• Crisis - emergency protocols</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-gray-500" />
                    Session Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• 8-phase EMDR protocol</li>
                    <li>• Automatic phase transitions</li>
                    <li>• Progress tracking</li>
                    <li>• Session history</li>
                    <li>• Personalization learning</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="algorithm" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Core Desensitization Algorithm</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                    <div className="text-green-600">// Revolutionary while(SUD &gt; 0) algorithm</div>
                    <div className="text-blue-600">function</div> <span className="text-purple-600">executeDesensitization</span>() {"{"}
                    <div className="ml-4">
                      <div className="text-blue-600">while</div> (currentSUD &gt; targetSUD) {"{"}
                      <div className="ml-4">
                        <div>startBilateralStimulation();</div>
                        <div>monitorEmotions();</div>
                        <div>applyAdaptiveLogic();</div>
                        <div>getAIGuidance();</div>
                        <div>await patientProcessing();</div>
                        <div>updateSUD();</div>
                      </div>
                      <div>{"}"}</div>
                      <div>transitionToInstallation();</div>
                    </div>
                    <div>{"}"}</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>8-Phase EMDR Protocol</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">1</Badge>
                      <span>Preparation - стабилизация и ресурсы</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">2</Badge>
                      <span>Assessment - выбор цели и оценка</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">3</Badge>
                      <span className="font-bold text-primary">Desensitization - обработка while(SUD &gt; 0)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">4</Badge>
                      <span>Installation - укрепление VOC (6-7)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">5</Badge>
                      <span>Body Scan - проверка тела</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">6</Badge>
                      <span>Closure - завершение</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">7</Badge>
                      <span>Reevaluation - переоценка</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">8</Badge>
                      <span>Integration - интеграция в жизнь</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Adaptive Emotion Rules</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-sm">
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="font-semibold text-red-700 dark:text-red-300">High Anxiety (Arousal &gt; 0.7)</div>
                      <div className="text-red-600 dark:text-red-400">- Slow BLS, activate safe place, calming voice</div>
                    </div>
                    
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="font-semibold text-blue-700 dark:text-blue-300">Dissociation (Low Arousal + Negative Valence)</div>
                      <div className="text-blue-600 dark:text-blue-400">- Pause BLS, grounding techniques, present moment</div>
                    </div>
                    
                    <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <div className="font-semibold text-orange-700 dark:text-orange-300">Overwhelm (Arousal &gt; 0.8)</div>
                      <div className="text-orange-600 dark:text-orange-400">- Stop processing, breathing techniques, stabilize</div>
                    </div>
                    
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="font-semibold text-green-700 dark:text-green-300">Low Engagement (Arousal &lt; -0.6)</div>
                      <div className="text-green-600 dark:text-green-400">- Increase BLS speed, activate processing</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Data Persistence</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• <strong>Target Memories:</strong> Description, SUD history, processing notes</li>
                    <li>• <strong>Effective BLS:</strong> Speed, patterns, configurations per user</li>
                    <li>• <strong>Emotion Patterns:</strong> Triggers, thresholds, responses</li>
                    <li>• <strong>AI Interactions:</strong> Effective prompts, therapeutic rapport</li>
                    <li>• <strong>Session Progress:</strong> Phase completion, breakthrough moments</li>
                    <li>• <strong>Personalization:</strong> Preferences, adaptation rates, learning</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Session Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Total Duration</span>
                      <Badge>45:30</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Effective Therapy Time</span>
                      <Badge>38:45</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>SUD Reduction</span>
                      <Badge className="bg-green-500">10 - 2</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>VOC Improvement</span>
                      <Badge className="bg-blue-500">1 - 6</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>AI Interactions</span>
                      <Badge>23</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Emotion Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Samples Collected</span>
                      <Badge>1,247</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Average Stability</span>
                      <Badge>73%</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Processing Depth</span>
                      <Badge>85%</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Volatility Index</span>
                      <Badge>0.42</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Coherence Score</span>
                      <Badge>0.78</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>BLS Effectiveness</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Total BLS Time</span>
                      <Badge>28:15</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Pattern Changes</span>
                      <Badge>12</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Avg Effectiveness</span>
                      <Badge className="bg-green-500">87%</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Optimal Pattern</span>
                      <Badge>Horizontal</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Optimal Speed</span>
                      <Badge>5.2 Hz</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>System Architecture Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-6 rounded-lg">
                  <div className="text-center text-sm text-muted-foreground">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-background rounded border-2 border-blue-200">
                        <Brain className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                        <div className="font-semibold">AI Therapist</div>
                        <div className="text-xs">GPT-5 Integration</div>
                      </div>
                      
                      <div className="p-4 bg-background rounded border-2 border-green-200">
                        <Activity className="w-8 h-8 mx-auto mb-2 text-green-500" />
                        <div className="font-semibold">Emotion Service</div>
                        <div className="text-xs">98 Affect Recognition</div>
                      </div>
                      
                      <div className="p-4 bg-background rounded border-2 border-purple-200">
                        <Eye className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                        <div className="font-semibold">BLS Engine</div>
                        <div className="text-xs">3D Stimulation</div>
                      </div>
                      
                      <div className="p-4 bg-background rounded border-2 border-orange-200">
                        <Mic className="w-8 h-8 mx-auto mb-2 text-orange-500" />
                        <div className="font-semibold">Voice AI</div>
                        <div className="text-xs">ElevenLabs TTS</div>
                      </div>
                    </div>
                    
                    <div className="mt-6 p-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded text-white">
                      <Heart className="w-8 h-8 mx-auto mb-2" />
                      <div className="font-bold">EMDR Session Conductor</div>
                      <div className="text-xs opacity-90">Revolutionary AI-Driven Orchestration</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}