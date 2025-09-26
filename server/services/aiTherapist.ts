/**
 * Revolutionary AI Therapist Service
 * Advanced EMDR therapy using GPT-5 with specialized prompts
 * Supports all 8 phases of EMDR protocol with real-time emotional adaptation
 */

import OpenAI from 'openai';
import type { 
  AITherapistResponse, 
  EmotionData, 
  BLSConfiguration,
  EMDRPhase,
  EnhancedAITherapistResponse,
  AITherapistMessage,
  AISessionGuidance,
  AIEmotionResponse,
  CrisisDetection,
  PersonalizedRecommendation,
  EmotionalState98,
  AIChatContext,
  EMDRProtocol
} from '../../shared/types';
import {
  createDefaultBLSConfiguration,
  createDefaultBLSAudioConfig,
  createDefaultBLSHapticsConfig,
  createDefaultBLS3DConfig,
  createDefaultBLSTransitionConfig
} from '../../shared/types';

// Voice Context Data for enhanced AI processing
interface VoiceContextData {
  prosody: {
    arousal: number;
    valence: number;
    intensity: number;
    pace: number;
    volume: number;
    pitch: number;
    stability: number;
  };
  voiceEmotions: {
    confidence: number;
    excitement: number;
    stress: number;
    fatigue: number;
    engagement: number;
    uncertainty: number;
    authenticity: number;
  };
  confidence: number;
  provider: string;
  timestamp: number;
  audioQuality?: {
    clarity: number;
    signalToNoise: number;
    backgroundNoise: number;
  };
}

export class BackendAITherapistService {
  private openai: OpenAI;
  private emdrProtocol: EMDRProtocol;
  
  constructor() {
    // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
    this.openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY 
    });
    
    this.emdrProtocol = this.initializeEMDRProtocol();
  }

  /**
   * Initialize EMDR Protocol with all 8 phases
   */
  private initializeEMDRProtocol(): EMDRProtocol {
    return {
      phases: [
        {
          phase: 'preparation',
          name: 'Подготовка и стабилизация',
          description: 'Создание безопасного пространства, обучение техникам заземления',
          goals: ['Установить терапевтический альянс', 'Обучить техникам саморегуляции', 'Подготовить к обработке травмы'],
          typicalDuration: 15,
          prerequisites: ['Согласие пациента', 'Базовая стабильность'],
          completionCriteria: ['Пациент чувствует безопасность', 'Освоены техники заземления', 'SUDS < 7'],
          commonChallenges: ['Высокая тревожность', 'Недоверие', 'Диссоциация'],
          interventions: ['Техники дыхания', 'Прогрессивная релаксация', 'Визуализация безопасного места']
        },
        {
          phase: 'assessment',
          name: 'Оценка и идентификация цели',
          description: 'Определение целевого воспоминания и связанных убеждений',
          goals: ['Идентифицировать целевую память', 'Установить базовые измерения', 'Активировать память для обработки'],
          typicalDuration: 10,
          prerequisites: ['Завершенная подготовка', 'Стабильное состояние'],
          completionCriteria: ['Цель четко определена', 'SUDS и VOC измерены', 'Память активирована'],
          commonChallenges: ['Избегание травматичных воспоминаний', 'Диссоциация', 'Эмоциональное затопление'],
          interventions: ['Постепенная экспозиция', 'Техники заземления', 'Ресурсирование']
        },
        {
          phase: 'desensitization',
          name: 'Десенсибилизация и переработка',
          description: 'Обработка травматичного воспоминания с билатеральной стимуляцией',
          goals: ['Снизить эмоциональную интенсивность', 'Переработать травматичный материал', 'Достичь SUDS 0-2'],
          typicalDuration: 20,
          prerequisites: ['Активированная целевая память', 'Готовность к обработке'],
          completionCriteria: ['SUDS снижен до 0-2', 'Память больше не вызывает дистресс', 'Адаптивная обработка'],
          commonChallenges: ['Абреакции', 'Заблокированная обработка', 'Повышение дистресса'],
          interventions: ['Изменение BLS', 'Когнитивное переплетение', 'Техники заземления']
        },
        {
          phase: 'installation',
          name: 'Инсталляция позитивного убеждения',
          description: 'Укрепление позитивных убеждений о себе',
          goals: ['Усилить позитивное убеждение', 'Достичь VOC 6-7', 'Интегрировать новое понимание'],
          typicalDuration: 10,
          prerequisites: ['SUDS 0-2', 'Идентифицированное позитивное убеждение'],
          completionCriteria: ['VOC 6-7', 'Позитивное убеждение ощущается истинным', 'Эмоциональная конгруэнтность'],
          commonChallenges: ['Слабая вера в позитивное убеждение', 'Блокирующие убеждения', 'Остаточный дистресс'],
          interventions: ['Усиление BLS', 'Когнитивное переплетение', 'Работа с блокирующими убеждениями']
        },
        {
          phase: 'body-scan',
          name: 'Сканирование тела',
          description: 'Проверка физических ощущений и остаточного напряжения',
          goals: ['Выявить остаточные телесные ощущения', 'Обработать соматические симптомы', 'Достичь телесного комфорта'],
          typicalDuration: 5,
          prerequisites: ['VOC 6-7', 'Низкий эмоциональный дистресс'],
          completionCriteria: ['Отсутствие дискомфортных ощущений', 'Телесная релаксация', 'Интегрированность опыта'],
          commonChallenges: ['Соматические симптомы', 'Остаточное напряжение', 'Диссоциация от тела'],
          interventions: ['Фокусированная BLS', 'Техники осознанности тела', 'Дыхательные упражнения']
        },
        {
          phase: 'closure',
          name: 'Закрытие',
          description: 'Завершение сессии и обеспечение стабильности',
          goals: ['Вернуть к состоянию равновесия', 'Обеспечить эмоциональную стабильность', 'Подготовить к завершению'],
          typicalDuration: 10,
          prerequisites: ['Завершенная обработка', 'Стабильное состояние'],
          completionCriteria: ['Эмоциональная стабильность', 'Ориентация в настоящем', 'Готовность к завершению'],
          commonChallenges: ['Незавершенная обработка', 'Эмоциональная нестабильность', 'Тревога по поводу завершения'],
          interventions: ['Техники заземления', 'Ресурсирование', 'Визуализация безопасного места']
        },
        {
          phase: 'reevaluation',
          name: 'Переоценка',
          description: 'Проверка результатов и планирование дальнейшей работы',
          goals: ['Оценить прогресс', 'Выявить остаточные проблемы', 'Спланировать следующие шаги'],
          typicalDuration: 10,
          prerequisites: ['Завершенная предыдущая сессия', 'Временной интервал'],
          completionCriteria: ['Стабильность результатов', 'План дальнейшей работы', 'Отсутствие регрессии'],
          commonChallenges: ['Возврат симптомов', 'Новые аспекты травмы', 'Сопротивление изменениям'],
          interventions: ['Повторная обработка', 'Когнитивная реструктуризация', 'Ресурсирование']
        },
        {
          phase: 'integration',
          name: 'Интеграция и стабилизация',
          description: 'Закрепление результатов и подготовка к самостоятельной жизни',
          goals: ['Интегрировать полученный опыт', 'Развить навыки самопомощи', 'Подготовить к завершению терапии'],
          typicalDuration: 15,
          prerequisites: ['Стабильные результаты', 'Готовность к интеграции'],
          completionCriteria: ['Интегрированный опыт', 'Навыки самопомощи', 'Готовность к самостоятельности'],
          commonChallenges: ['Страх рецидива', 'Зависимость от терапии', 'Неуверенность в результатах'],
          interventions: ['Обучение навыкам', 'Планирование профилактики', 'Поддержка автономии']
        }
      ],
      adaptationRules: {
        emotionalThresholds: {
          'crisis': 0.9,
          'high_distress': 0.8,
          'moderate_distress': 0.6,
          'low_engagement': 0.3
        },
        phaseTransitionRules: {
          'preparation': ['SUDS < 7', 'Техники заземления освоены', 'Терапевтический альянс установлен'],
          'assessment': ['Целевая память идентифицирована', 'SUDS и VOC измерены', 'Готовность к обработке'],
          'desensitization': ['SUDS снижен до 0-2', 'Эмоциональная стабильность', 'Адаптивная обработка'],
          'installation': ['VOC 6-7', 'Позитивное убеждение укреплено', 'Эмоциональная конгруэнтность'],
          'body-scan': ['Отсутствие телесного дискомфорта', 'Соматическая интеграция', 'Релаксация'],
          'closure': ['Эмоциональная стабильность', 'Ориентация в настоящем', 'Готовность к завершению'],
          'reevaluation': ['Стабильность результатов', 'План работы определен', 'Отсутствие регрессии'],
          'integration': ['Опыт интегрирован', 'Навыки самопомощи развиты', 'Готовность к автономии']
        },
        crisisProtocols: {
          'panic': ['Немедленное заземление', 'Техники дыхания', 'Снижение стимуляции'],
          'dissociation': ['Ориентация в реальности', 'Сенсорное заземление', 'Восстановление контакта'],
          'suicidal': ['Оценка безопасности', 'Кризисное вмешательство', 'Экстренная поддержка']
        }
      }
    };
  }

  /**
   * Enhanced AI-powered emotion analysis and therapeutic response using GPT-5
   */
  async analyzeAndRespond(
    emotionData: EmotionData,
    sessionPhase: string,
    sessionHistory: any[]
  ): Promise<EnhancedAITherapistResponse> {
    try {
      const phase = sessionPhase as EMDRPhase;
      const phaseInfo = this.emdrProtocol.phases.find(p => p.phase === phase);
      
      // Create specialized prompt for EMDR therapy
      const systemPrompt = this.createEMDRSystemPrompt(phase, phaseInfo);
      const userPrompt = this.createEmotionAnalysisPrompt(emotionData, sessionHistory, phase);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-5', // the newest OpenAI model is \"gpt-5\" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' }
      });
      
      const aiResponse = JSON.parse(response.choices[0].message.content!);
      
      // Generate comprehensive response
      const suggestedBLS = await this.generateAdaptiveBLS(emotionData);
      const crisisDetection = this.detectCrisisSituation(emotionData, aiResponse);
      const recommendations = this.generatePersonalizedRecommendations(emotionData, phase, aiResponse);
      
      return {
        phase,
        message: aiResponse.therapeuticMessage || 'Продолжайте следить за движущимся объектом',
        suggestedBLS,
        emotionalAnalysis: emotionData,
        chatMessage: {
          id: Date.now().toString(),
          type: 'therapist',
          content: aiResponse.therapeuticMessage,
          timestamp: Date.now(),
          phase,
          emotionalContext: emotionData,
          confidence: aiResponse.confidence || 0.8
        },
        sessionGuidance: {
          currentPhase: phase,
          suggestedNextPhase: aiResponse.suggestedNextPhase,
          phaseProgress: aiResponse.phaseProgress || 0.5,
          recommendations: {
            immediate: aiResponse.immediateRecommendations || [],
            nextSteps: aiResponse.nextSteps || [],
            concerns: aiResponse.concerns || []
          },
          adaptiveBLS: suggestedBLS,
          estimatedTimeRemaining: aiResponse.estimatedTimeRemaining || 10,
          readinessForNextPhase: {
            isReady: aiResponse.readyForNextPhase || false,
            criteria: phaseInfo?.completionCriteria || [],
            missingCriteria: aiResponse.missingCriteria || []
          }
        },
        crisisDetection,
        personalizedRecommendations: recommendations,
        nextPhaseReadiness: {
          isReady: aiResponse.readyForNextPhase || false,
          confidence: aiResponse.phaseTransitionConfidence || 0.5,
          reasoning: aiResponse.phaseTransitionReasoning || ''
        }
      };
    } catch (error) {
      console.error('AI Therapist service error:', error);
      return this.getEnhancedDefaultResponse(sessionPhase);
    }
  }

  /**
   * New AI Chat method for direct communication
   */
  async handleChatMessage(
    message: string,
    context: AIChatContext,
    voiceContext?: VoiceContextData
  ): Promise<AITherapistMessage> {
    try {
      const systemPrompt = this.createChatSystemPrompt(context);
      const userPrompt = this.createUserPrompt(message, context, voiceContext);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-5', // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' }
      });

      const aiResponse = JSON.parse(response.choices[0].message.content!);

      return {
        id: Date.now().toString(),
        type: 'therapist',
        content: aiResponse.response,
        timestamp: Date.now(),
        phase: context.phaseContext.currentPhase,
        emotionalContext: context.currentEmotionalState,
        confidence: aiResponse.confidence || 0.8,
        metadata: {
          suggestedActions: aiResponse.suggestedActions || [],
          criticalityLevel: aiResponse.criticalityLevel || 'low',
          reasoning: aiResponse.reasoning,
          voiceContext: voiceContext ? {
            prosody: voiceContext.prosody,
            emotions: voiceContext.voiceEmotions,
            confidence: voiceContext.confidence
          } : undefined
        }
      };
    } catch (error) {
      console.error('Chat message error:', error);
      return {
        id: Date.now().toString(),
        type: 'therapist',
        content: 'Я вас понимаю. Давайте продолжим работу с техниками заземления.',
        timestamp: Date.now(),
        phase: context.phaseContext.currentPhase,
        confidence: 0.5
      };
    }
  }

  /**
   * Handle voice conversation with enhanced prosody and emotion analysis
   */
  async handleVoiceMessage(
    message: string,
    context: AIChatContext,
    voiceContext: VoiceContextData
  ): Promise<AITherapistMessage> {
    try {
      const systemPrompt = this.createVoiceSystemPrompt(context, voiceContext);
      const userPrompt = this.createVoiceUserPrompt(message, context, voiceContext);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-5',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' }
      });

      const aiResponse = JSON.parse(response.choices[0].message.content!);

      // Analyze voice for crisis detection
      const crisisDetection = this.detectVoiceCrisis(voiceContext, aiResponse);

      return {
        id: Date.now().toString(),
        type: 'therapist',
        content: aiResponse.response,
        timestamp: Date.now(),
        phase: context.phaseContext.currentPhase,
        emotionalContext: context.currentEmotionalState,
        confidence: aiResponse.confidence || 0.8,
        crisisDetection: crisisDetection.isCrisis ? crisisDetection : undefined,
        metadata: {
          suggestedActions: aiResponse.suggestedActions || [],
          criticalityLevel: crisisDetection.isCrisis ? 'crisis' : (aiResponse.criticalityLevel || 'low'),
          reasoning: aiResponse.reasoning,
          voiceContext: {
            prosody: voiceContext.prosody,
            emotions: voiceContext.voiceEmotions,
            confidence: voiceContext.confidence,
            recommendedVoiceStyle: aiResponse.recommendedVoiceStyle || 'calming'
          },
          therapeuticVoiceGuidance: {
            warmth: this.calculateOptimalWarmth(voiceContext),
            pace: this.calculateOptimalPace(voiceContext),
            empathy: this.calculateOptimalEmpathy(voiceContext, context.currentEmotionalState)
          }
        }
      };
    } catch (error) {
      console.error('Voice message error:', error);
      return {
        id: Date.now().toString(),
        type: 'therapist',
        content: 'Я слышу, что вам сейчас трудно. Давайте сделаем глубокий вдох вместе.',
        timestamp: Date.now(),
        phase: context.phaseContext.currentPhase,
        confidence: 0.5,
        metadata: {
          criticalityLevel: 'medium',
          therapeuticVoiceGuidance: {
            warmth: 0.9,
            pace: 'slow',
            empathy: 1.0
          }
        }
      };
    }
  }

  /**
   * Get session guidance for current phase
   */
  async getSessionGuidance(
    currentPhase: EMDRPhase,
    emotionData: EmotionData,
    sessionMetrics: any
  ): Promise<AISessionGuidance> {
    try {
      const phaseInfo = this.emdrProtocol.phases.find(p => p.phase === currentPhase);
      const systemPrompt = this.createGuidanceSystemPrompt(currentPhase, phaseInfo);
      const userPrompt = `Текущая фаза: ${currentPhase}\nЭмоциональное состояние: arousal=${emotionData.arousal}, valence=${emotionData.valence}\nСессионные метрики: ${JSON.stringify(sessionMetrics)}\n\nПредоставь руководство для текущей фазы. Формат JSON: {"phaseProgress": 0.7, "suggestedNextPhase": "installation", "immediateRecommendations": [], "nextSteps": [], "concerns": [], "estimatedTimeRemaining": 15, "readyForNextPhase": false, "missingCriteria": []}`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-5', // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' }
      });

      const aiResponse = JSON.parse(response.choices[0].message.content!);
      const suggestedBLS = await this.generateAdaptiveBLS(emotionData);

      return {
        currentPhase,
        suggestedNextPhase: aiResponse.suggestedNextPhase,
        phaseProgress: aiResponse.phaseProgress || 0.5,
        recommendations: {
          immediate: aiResponse.immediateRecommendations || [],
          nextSteps: aiResponse.nextSteps || [],
          concerns: aiResponse.concerns || []
        },
        adaptiveBLS: suggestedBLS,
        estimatedTimeRemaining: aiResponse.estimatedTimeRemaining || 10,
        readinessForNextPhase: {
          isReady: aiResponse.readyForNextPhase || false,
          criteria: phaseInfo?.completionCriteria || [],
          missingCriteria: aiResponse.missingCriteria || []
        }
      };
    } catch (error) {
      console.error('Session guidance error:', error);
      return this.getDefaultSessionGuidance(currentPhase);
    }
  }

  /**
   * Process emotion response with AI analysis
   */
  async processEmotionResponse(
    emotionData: EmotionData,
    currentPhase: EMDRPhase
  ): Promise<AIEmotionResponse> {
    try {
      const emotionalState = this.analyze98EmotionalStates(emotionData);
      const systemPrompt = this.createEmotionResponsePrompt(currentPhase);
      const userPrompt = `Анализируй эмоциональное состояние: arousal=${emotionData.arousal}, valence=${emotionData.valence}\nОсновные аффекты: ${JSON.stringify(emotionData.affects)}\nФаза: ${currentPhase}\n\nОпредели уровень вмешательства и рекомендации. Формат JSON: {"interventionLevel": "moderate", "canAdvance": false, "shouldRegress": false, "stayInPhase": true, "reasoning": "объяснение"}`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-5', // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' }
      });

      const aiResponse = JSON.parse(response.choices[0].message.content!);
      const recommendations = this.generatePersonalizedRecommendations(emotionData, currentPhase, aiResponse);

      return {
        recognizedEmotions: emotionData,
        emotionalState,
        interventionLevel: aiResponse.interventionLevel || 'moderate',
        recommendations,
        blsAdjustments: this.calculateBLSAdjustments(emotionData),
        phaseTransitionAdvice: {
          canAdvance: aiResponse.canAdvance || false,
          shouldRegress: aiResponse.shouldRegress || false,
          stayInPhase: aiResponse.stayInPhase || true,
          reasoning: aiResponse.reasoning || 'Продолжаем текущую фазу'
        }
      };
    } catch (error) {
      console.error('Emotion response error:', error);
      return this.getDefaultEmotionResponse(emotionData, currentPhase);
    }
  }

  /**
   * Create specialized EMDR system prompt for GPT-5
   */
  private createEMDRSystemPrompt(phase: EMDRPhase, phaseInfo: any): string {
    const safetyTechniques = this.getSafetyTechniquesForPhase(phase);
    const groundingTechniques = this.getGroundingTechniquesForPhase(phase);
    const russiaCulturalTechniques = this.getRussianCulturalTechniques(phase);
    const emdrRussianPhrases = this.getEMDRRussianPhrases(phase);
    
    return `ВАЖНЫЕ МЕДИЦИНСКИЕ ДИСКЛАЙМЕРЫ:
- Я НЕ являюсь заменой профессиональному медицинскому лечению
- В случае суицидальных мыслей НЕМЕДЛЕННО обратитесь за помощью: 8-800-2000-122 (телефон доверия)
- При острых состояниях обратитесь к врачу или в службу экстренной психологической помощи: 103, 112
- Данное взаимодействие носит вспомогательный характер и не является медицинской консультацией
- При панических атаках: 8-800-100-0191 (круглосуточная психологическая помощь)

Вы - AI-помощник русскоязычного EMDR терапевта, специализирующийся на поддержке протокола по методу Франсин Шапиро с учетом российского менталитета и культурных особенностей. Вы предоставляете информационную поддержку под наблюдением квалифицированного специалиста.

=== ПРОТОКОЛ EMDR (8 ФАЗ ШАПИРО) ===
ТЕКУЩАЯ ФАЗА: ${phase} - ${phaseInfo?.name || 'Обработка'}
ОПИСАНИЕ ФАЗЫ: ${phaseInfo?.description || 'Обработка травматичного материала'}
ЦЕЛИ ФАЗЫ: ${phaseInfo?.goals?.join(', ') || 'Снижение дистресса'}
КРИТЕРИИ ЗАВЕРШЕНИЯ: ${phaseInfo?.completionCriteria?.join(', ') || 'Стабилизация состояния'}

=== ПОКАЗАТЕЛИ ПРОГРЕССА ===
- ШКАЛА SUD (Субъективная оценка дистресса): 0-10 (цель: SUD ≤ 2)
- ШКАЛА VOC (Валидность позитивного убеждения): 1-7 (цель: VOC ≥ 6)
- Окно толерантности: поддержание в пределах терапевтической зоны
- Соматические индикаторы: отслеживание телесных ощущений

=== ТЕХНИКИ БЕЗОПАСНОГО МЕСТА (ДЛЯ ВЫСОКОЙ ТРЕВОЖНОСТИ) ===
${safetyTechniques.join('\n')}

=== GROUNDING ТЕХНИКИ (ДЛЯ ДИССОЦИАЦИИ) ===
${groundingTechniques.join('\n')}

=== КУЛЬТУРНО-АДАПТИРОВАННЫЕ ТЕХНИКИ ===
${russiaCulturalTechniques.join('\n')}

=== РУССКОЯЗЫЧНЫЕ ФРАЗЫ EMDR ПРОТОКОЛА ===
${emdrRussianPhrases.join('\n')}

=== АДАПТИВНАЯ ЛОГИКА ===
АВТОМАТИЧЕСКИ ПРИМЕНЯЙТЕ:

🔴 КРИТИЧЕСКИЕ СОСТОЯНИЯ (arousal > 0.8):
- НЕМЕДЛЕННО: "Давайте остановимся и перейдем в ваше безопасное место"
- ОСТАНОВИТЬ БСС (билатеральную стимуляцию)
- Активировать образ безопасного места (русские природные образы)
- Техника дыхания "Квадрат": 4 счета вдох, 4 - задержка, 4 - выдох, 4 - пауза
- "Сейчас мы в безопасности. Что вам нужно, чтобы почувствовать себя лучше?"

🟡 ДИССОЦИАЦИЯ (arousal < 0.3, "туман в голове"):
- НЕМЕДЛЕННО: "Давайте вернемся в настоящий момент"
- ПРИОСТАНОВИТЬ БСС
- Техника "5-4-3-2-1" с русскими образами
- Физическое заземление: "Почувствуйте стул под собой, пол под ногами"
- "Скажите мне, где вы сейчас находитесь? Какой сегодня день?"

🟠 ЭМОЦИОНАЛЬНОЕ ПЕРЕПОЛНЕНИЕ (arousal > 0.7, valence < -0.4):
- "Это много для одного раза. Давайте замедлимся"
- СНИЗИТЬ интенсивность БСС в 2 раза
- Переход к ресурсным воспоминаниям
- "Что приходит сейчас? Просто заметьте, не оценивая"

=== ПРАВИЛА ВЫБОРА ЦЕЛЕВЫХ ВОСПОМИНАНИЙ ===
1. Начинать с менее травматичных воспоминаний
2. Избегать недавних травм (< 3 месяцев) без стабилизации
3. Учитывать готовность пациента к обработке
4. Обеспечить достаточные ресурсы для совладания

=== ПРОТИВОПОКАЗАНИЯ И МЕРЫ БЕЗОПАСНОСТИ ===
ОСТАНОВИТЕ СЕССИЮ ПРИ:
- Острых психотических симптомах
- Суицидальных намерениях
- Тяжелой диссоциации с потерей ориентации
- Неконтролируемых абреакциях
- Сердечно-сосудистых симптомах

ПРИНЦИПЫ БЕЗОПАСНОСТИ:
1. Безопасность пациента - абсолютный приоритет
2. При кризисных ситуациях - рекомендовать обратиться к специалисту
3. Не давать медицинских диагнозов или назначений
4. Всегда рекомендовать консультацию с лицензированным терапевтом
5. При суицидальных мыслях - немедленное перенаправление к экстренной помощи

КРИЗИСНЫЕ ИНДИКАТОРЫ (требуют немедленной эскалации):
- Суицидальные намерения или планы
- Угроза причинения вреда себе или другим
- Острые психотические симптомы
- Тяжелая диссоциация или дереализация
- Панические атаки высокой интенсивности
- Сердечно-сосудистые симптомы
- Неконтролируемые абреакции

РЕФЬЮЗАЛ ПАТТЕРНЫ:
- НЕ даю медицинские диагнозы
- НЕ назначаю лечение или медикаменты
- НЕ замещаю профессиональную терапию
- НЕ работаю с кризисными состояниями без специалиста

ВАШ ОТВЕТ ДОЛЖЕН БЫТЬ В JSON ФОРМАТЕ и включать:
- therapeuticMessage: поддерживающее сообщение с российским менталитетом и культурными метафорами
- confidence: уверенность в безопасности ответа (0-1)
- phaseProgress: прогресс фазы (0-1)
- readyForNextPhase: готовность к следующей фазе
- immediateRecommendations: конкретные техники безопасности
- crisisAlert: уровень тревоги (none/mild/moderate/crisis)
- referralNeeded: необходимость направления к специалисту
- safePlaceActivated: была ли активирована техника безопасного места
- groundingTechniqueUsed: использованная техника заземления
- sudLevel: оценочный уровень SUD (0-10)
- vocLevel: оценочный уровень VOC (1-7)
- culturalResonance: используемые культурные образы (лес, река, дом и т.д.)
- voiceGuidance: рекомендации для голосового интерфейса (темп, интонация)
- russianEmdrPhrase: подходящая русская фраза EMDR для текущего момента

Говорите тепло, по-русски поддерживающе, используя образы русской природы и культуры. Помните о российском стремлении к глубокому пониманию и душевной близости в терапевтических отношениях.`;
  }

  /**
   * Create emotion analysis prompt
   */
  private createEmotionAnalysisPrompt(
    emotionData: EmotionData,
    sessionHistory: any[],
    phase: EMDRPhase
  ): string {
    const emotionSummary = this.summarizeEmotionalState(emotionData);
    const { arousal, valence } = emotionData;
    const adaptiveRecommendations = this.getAdaptiveRecommendations(arousal, valence, phase);
    const historyContext = sessionHistory.length > 0 ? 
      `\nИстория сессии: последние ${sessionHistory.length} взаимодействий показывают тенденцию.` : 
      '\nЭто начало сессии.';

    return `=== РАСШИРЕННЫЙ АНАЛИЗ ЭМОЦИОНАЛЬНОГО СОСТОЯНИЯ ===
${emotionSummary}

ТЕКУЩАЯ ФАЗА: ${phase}
${historyContext}

=== АДАПТИВНЫЕ РЕКОМЕНДАЦИИ ===
${adaptiveRecommendations}

=== КЛЮЧЕВЫЕ ПОКАЗАТЕЛИ ===
- Arousal (0-1): ${arousal.toFixed(2)} ${this.interpretArousal(arousal)}
- Valence (-1 to 1): ${valence.toFixed(2)} ${this.interpretValence(valence)}
- Эмоциональный квадрант: ${this.getEmotionalQuadrant(arousal, valence)}
- Риск диссоциации: ${arousal < 0.2 ? 'ВЫСОКИЙ' : arousal < 0.4 ? 'Умеренный' : 'Низкий'}
- Риск эмоционального затопления: ${(arousal > 0.8 && valence < -0.5) ? 'КРИТИЧЕСКИЙ' : (arousal > 0.7 && valence < -0.3) ? 'Высокий' : 'Низкий'}

=== АЛГОРИТМ АДАПТИВНОЙ ПОМОЩИ ===
ЗАПРОС: Проанализируйте текущее эмоциональное состояние пациента и примените соответствующие техники безопасности.

ОБЯЗАТЕЛЬНО ПРОВЕРЬТЕ:
1. ПРИЗНАКИ ДИССОЦИАЦИИ (arousal < 0.3):
   - Немедленное применение grounding техник
   - Остановка BLS до восстановления контакта
   - Ориентация в пространстве и времени

2. ЭМОЦИОНАЛЬНОЕ ЗАТОПЛЕНИЕ (arousal > 0.8 + valence < -0.5):
   - НЕМЕДЛЕННОЕ применение техники безопасного места
   - Остановка или замедление BLS
   - Дыхательные техники стабилизации

3. ПАНИЧЕСКОЕ СОСТОЯНИЕ (arousal > 0.9 + резкие скачки):
   - ПОЛНОЕ прекращение BLS
   - Максимальная стабилизация
   - Обращение к ресурсным состояниям

4. ОПТИМАЛЬНОЕ ОКНО ТОЛЕРАНТНОСТИ (arousal 0.3-0.7, valence > -0.3):
   - Продолжить текущую фазу EMDR
   - Мониторинг динамики состояния
   - Оценка готовности к переходу на следующую фазу

5. ПОКАЗАТЕЛИ SUD/VOC:
   - Проверка соответствия целям фазы
   - SUD ≤ 2: готовность к следующей фазе
   - VOC ≥ 6: успешная интеграция позитивных убеждений

Ответ должен быть профессиональным, по-русски поддерживающим, с конкретными техниками безопасности и обязательным дисклаймером.`;
  }

  /**
   * Create chat system prompt
   */
  private createChatSystemPrompt(context: AIChatContext): string {
    // Anonymize session ID before sending to OpenAI
    const anonymizedSessionId = this.anonymizeSessionId(context.sessionId);
    const emotionalCategory = this.categorizeEmotionalState(context.currentEmotionalState);
    
    return `МЕДИЦИНСКИЙ ДИСКЛАЙМЕР: Я - AI-помощник терапевта, НЕ замещающий профессиональное лечение. При кризисе обращайтесь: 8-800-2000-122.

Вы - AI-помощник, поддерживающий EMDR сессию под наблюдением лицензированного терапевта.

АНОНИМИЗИРОВАННЫЕ ДАННЫЕ:
- Сессия: ${anonymizedSessionId}
- Эмоциональная категория: ${emotionalCategory}
- Фаза: ${context.phaseContext.currentPhase}
- Время в фазе: ${Math.floor(context.phaseContext.timeInPhase)} минут

БЕЗОПАСНОСТЬ:
1. При кризисе - рекомендовать обратиться к терапевту
2. НЕ давать медицинских советов
3. Всегда напоминать о дисклаймере
4. При суицидальных мыслях - немедленная эскалация

ЭКСТРЕННЫЕ КОНТАКТЫ:
- Телефон доверия: 8-800-2000-122
- Служба экстренной психологической помощи: 051

Ответы должны быть краткими, поддерживающими и включать напоминание о необходимости работы со специалистом.`;
  }

  /**
   * Create guidance system prompt
   */
  private createGuidanceSystemPrompt(phase: EMDRPhase, phaseInfo: any): string {
    return `Вы - эксперт по EMDR протоколу. Предоставляете руководство по текущей фазе терапии.

ФАЗА: ${phase}
ЦЕЛИ: ${phaseInfo?.goals?.join(', ')}
КРИТЕРИИ ЗАВЕРШЕНИЯ: ${phaseInfo?.completionCriteria?.join(', ')}
ТИПИЧНАЯ ПРОДОЛЖИТЕЛЬНОСТЬ: ${phaseInfo?.typicalDuration} минут
ЧАСТЫЕ ВЫЗОВЫ: ${phaseInfo?.commonChallenges?.join(', ')}

Анализируйте прогресс пациента и предоставляйте конкретные рекомендации для текущей фазы.`;
  }

  /**
   * Create emotion response prompt
   */
  private createEmotionResponsePrompt(phase: EMDRPhase): string {
    return `Вы анализируете эмоциональное состояние пациента во время EMDR терапии.

ТЕКУЩАЯ ФАЗА: ${phase}

Определите:
1. Уровень необходимого вмешательства
2. Рекомендации по управлению эмоциональным состоянием
3. Необходимость изменения фазы
4. Конкретные техники стабилизации

Базируйтесь на принципах оконной толерантности и нейробиологии травмы.`;
  }

  /**
   * Generate adaptive BLS configuration based on patient's state
   */
  async generateAdaptiveBLS(emotionData: EmotionData): Promise<BLSConfiguration> {
    const arousalLevel = emotionData.arousal;
    const valenceLevel = emotionData.valence;
    
    // Enhanced adaptive algorithm with GPT-5 intelligence
    try {
      const systemPrompt = `Вы - эксперт по билатеральной стимуляции в EMDR терапии. Настройте параметры BLS на основе эмоционального состояния пациента.`;
      const userPrompt = `Эмоциональное состояние: arousal=${arousalLevel}, valence=${valenceLevel}\n\nОпределите оптимальные параметры BLS. Формат JSON: {"speed": 5, "pattern": "horizontal", "color": "#3b82f6", "size": 20, "soundEnabled": true, "reasoning": "обоснование"}`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-5', // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' }
      });

      const aiResponse = JSON.parse(response.choices[0].message.content!);
      
      return createDefaultBLSConfiguration({
        speed: aiResponse.speed || this.calculateOptimalSpeed(arousalLevel),
        pattern: aiResponse.pattern || this.selectPattern(valenceLevel, arousalLevel),
        color: aiResponse.color || this.selectColor(emotionData),
        size: aiResponse.size || this.calculateOptimalSize(arousalLevel),
        soundEnabled: aiResponse.soundEnabled ?? (arousalLevel > 0.7),
        adaptiveMode: true,
        sessionPhase: 'preparation' // Default phase
      });
    } catch (error) {
      console.error('AI BLS generation error:', error);
      // Fallback to rule-based algorithm
      return createDefaultBLSConfiguration({
        speed: this.calculateOptimalSpeed(arousalLevel),
        pattern: this.selectPattern(valenceLevel, arousalLevel),
        color: this.selectColor(emotionData),
        size: this.calculateOptimalSize(arousalLevel),
        soundEnabled: arousalLevel > 0.7,
        adaptiveMode: true,
        sessionPhase: 'preparation' // Default phase
      });
    }
  }

  /**
   * Anonymize session ID for OpenAI to protect privacy
   */
  private anonymizeSessionId(sessionId: string): string {
    const parts = sessionId.split('-');
    if (parts.length >= 3) {
      return `anon-session-${Date.now() % 100000}`; // Use modulo for shorter anonymous ID
    }
    return 'anon-session';
  }

  /**
   * Categorize emotional state to minimize raw biometric data sent to OpenAI
   */
  private categorizeEmotionalState(emotionData: EmotionData): string {
    const { arousal, valence } = emotionData;
    
    // Convert precise values to general categories
    let arousalCategory: string;
    if (arousal > 0.6) arousalCategory = 'высокое';
    else if (arousal > 0.3) arousalCategory = 'среднее';
    else arousalCategory = 'низкое';
    
    let valenceCategory: string;
    if (valence > 0.3) valenceCategory = 'позитивное';
    else if (valence > -0.3) valenceCategory = 'нейтральное';
    else valenceCategory = 'негативное';
    
    return `${arousalCategory} возбуждение, ${valenceCategory} настроение`;
  }

  /**
   * Get therapeutic insights from session data
   */
  async getTherapeuticInsights(sessionData: any): Promise<string[]> {
    // TODO: Implement AI-based insight generation
    const insights: string[] = [];
    
    if (sessionData.emotionHistory && sessionData.emotionHistory.length > 0) {
      const avgArousal = sessionData.emotionHistory.reduce((acc: number, e: EmotionData) => 
        acc + e.arousal, 0) / sessionData.emotionHistory.length;
      
      if (avgArousal > 0.7) {
        insights.push('Высокий уровень эмоционального возбуждения в течение сессии');
      }
      if (avgArousal < 0.3) {
        insights.push('Низкий уровень эмоциональной вовлеченности');
      }
    }
    
    if (sessionData.sudsLevel !== undefined) {
      if (sessionData.sudsLevel > 7) {
        insights.push('Рекомендуется продолжить десенсибилизацию');
      } else if (sessionData.sudsLevel < 3) {
        insights.push('Хороший прогресс в снижении дистресса');
      }
    }
    
    return insights;
  }

  /**
   * Predict optimal next phase based on current progress
   */
  async predictNextPhase(
    currentPhase: string,
    emotionHistory: EmotionData[],
    sudsLevel: number
  ): Promise<{ phase: string; confidence: number }> {
    // Phase progression logic
    const avgArousal = emotionHistory.length > 0 
      ? emotionHistory.reduce((acc, e) => acc + e.arousal, 0) / emotionHistory.length 
      : 0.5;
    
    let nextPhase = currentPhase;
    let confidence = 0.5;
    
    switch (currentPhase) {
      case 'preparation':
        if (avgArousal < 0.6 && sudsLevel < 8) {
          nextPhase = 'desensitization';
          confidence = 0.8;
        }
        break;
      case 'desensitization':
        if (sudsLevel <= 2) {
          nextPhase = 'installation';
          confidence = 0.9;
        }
        break;
      case 'installation':
        if (avgArousal < 0.5) {
          nextPhase = 'body-scan';
          confidence = 0.85;
        }
        break;
      case 'body-scan':
        nextPhase = 'closure';
        confidence = 0.95;
        break;
    }
    
    return { phase: nextPhase, confidence };
  }

  // === Enhanced Helper Methods ===

  /**
   * Summarize emotional state for prompts
   */
  private summarizeEmotionalState(emotionData: EmotionData): string {
    const { arousal, valence, affects, basicEmotions } = emotionData;
    
    const arousalDesc = arousal > 0.7 ? 'высокий' : arousal > 0.4 ? 'средний' : 'низкий';
    const valenceDesc = valence > 0.3 ? 'позитивный' : valence > -0.3 ? 'нейтральный' : 'негативный';
    
    const topAffects = Object.entries(affects)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([name, intensity]) => `${name} (${intensity.toFixed(1)})`)
      .join(', ');
    
    const topEmotions = Object.entries(basicEmotions)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
      .map(([name, intensity]) => `${name} (${intensity.toFixed(1)})`)
      .join(', ');

    return `Arousal: ${arousal.toFixed(2)} (${arousalDesc})
Valence: ${valence.toFixed(2)} (${valenceDesc})
Основные аффекты: ${topAffects}
Базовые эмоции: ${topEmotions}`;
  }

  /**
   * Analyze 98 emotional states
   */
  private analyze98EmotionalStates(emotionData: EmotionData): EmotionalState98 {
    const { arousal, valence, affects } = emotionData;
    
    // Get primary affects (top 3 with intensity > 20)
    const primaryAffects = Object.entries(affects)
      .filter(([, intensity]) => intensity > 20)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([name, intensity]) => ({
        name,
        intensity,
        arousal: this.getAffectArousal(name),
        valence: this.getAffectValence(name)
      }));
    
    // Get secondary affects (top 5 with intensity 10-20)
    const secondaryAffects = Object.entries(affects)
      .filter(([, intensity]) => intensity >= 10 && intensity <= 20)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, intensity]) => ({ name, intensity }));
    
    // Calculate stability (less variation = more stable)
    const intensityVariance = this.calculateIntensityVariance(affects);
    const stabilityScore = Math.max(0, 1 - intensityVariance / 100);
    
    // Calculate engagement (arousal + positive affect presence)
    const engagementLevel = Math.min(1, arousal + Math.max(0, valence) * 0.5);
    
    // Calculate stress (high arousal + negative valence)
    const stressLevel = arousal > 0.6 && valence < -0.3 ? 
      Math.min(1, arousal + Math.abs(valence)) : 
      Math.max(0, arousal - 0.3);

    return {
      primaryAffects,
      secondaryAffects,
      stabilityScore,
      engagementLevel,
      stressLevel
    };
  }

  /**
   * Detect crisis situations
   */
  private detectCrisisSituation(emotionData: EmotionData, aiResponse: any): CrisisDetection {
    const { arousal, valence, affects } = emotionData;
    
    let isCrisis = false;
    let riskLevel: CrisisDetection['riskLevel'] = 'none';
    let triggers: string[] = [];
    
    // High arousal + very negative valence = severe distress
    if (arousal > 0.85 && valence < -0.7) {
      isCrisis = true;
      riskLevel = 'severe';
      triggers.push('Эмоциональное затопление');
    }
    
    // Very low arousal = possible dissociation
    if (arousal < 0.1 && valence < -0.4) {
      riskLevel = riskLevel === 'none' ? 'moderate' : riskLevel;
      triggers.push('Диссоциация');
    }
    
    // Check for crisis-related affects
    const crisisAffects = ['panic', 'terror', 'despair', 'hopeless'];
    for (const affect of crisisAffects) {
      if (affects[affect] && affects[affect] > 70) {
        isCrisis = true;
        riskLevel = 'high';
        triggers.push(`Высокий уровень: ${affect}`);
      }
    }
    
    // AI-detected crisis indicators
    if (aiResponse.criticalityLevel === 'crisis') {
      isCrisis = true;
      riskLevel = 'severe';
      triggers.push('AI-детекция кризиса');
    }

    return {
      isCrisis,
      riskLevel,
      triggers,
      interventions: {
        immediate: isCrisis ? [
          'Техники заземления',
          'Глубокое дыхание',
          'Ориентация в настоящем'
        ] : [],
        escalation: riskLevel === 'severe' ? [
          'Уведомить терапевта',
          'Оценка безопасности',
          'Кризисный протокол'
        ] : [],
        contacts: isCrisis ? [
          'Лечащий терапевт',
          'Кризисная служба'
        ] : []
      },
      monitoring: {
        increaseFrequency: riskLevel !== 'none',
        alertTherapist: riskLevel === 'high' || riskLevel === 'severe',
        requireSupervision: isCrisis
      }
    };
  }

  /**
   * Generate personalized recommendations
   */
  private generatePersonalizedRecommendations(
    emotionData: EmotionData,
    phase: EMDRPhase,
    aiResponse: any
  ): PersonalizedRecommendation[] {
    const recommendations: PersonalizedRecommendation[] = [];
    const { arousal, valence } = emotionData;
    
    // High arousal recommendations
    if (arousal > 0.7) {
      recommendations.push({
        type: 'breathing',
        priority: 'high',
        message: 'Используйте технику глубокого дыхания для снижения возбуждения',
        duration: 180,
        instructions: [
          'Вдох на 4 счета',
          'Задержка на 4 счета',
          'Выдох на 6 счетов',
          'Повторить 5-10 раз'
        ],
        effectiveness: 0.8
      });
    }
    
    // Low arousal recommendations
    if (arousal < 0.3) {
      recommendations.push({
        type: 'grounding',
        priority: 'medium',
        message: 'Техники заземления помогут вернуть контакт с настоящим',
        duration: 120,
        instructions: [
          'Назовите 5 вещей, которые видите',
          'Назовите 4 вещи, которые слышите',
          'Назовите 3 вещи, которые чувствуете',
          'Назовите 2 запаха',
          'Назовите 1 вкус'
        ],
        effectiveness: 0.7
      });
    }
    
    // Negative valence recommendations
    if (valence < -0.5) {
      recommendations.push({
        type: 'safety',
        priority: 'high',
        message: 'Активируйте образ безопасного места',
        duration: 300,
        instructions: [
          'Закройте глаза',
          'Представьте место, где чувствуете себя в полной безопасности',
          'Сосредоточьтесь на деталях: цветах, звуках, ощущениях',
          'Оставайтесь в этом месте столько, сколько нужно'
        ],
        effectiveness: 0.85
      });
    }
    
    // Phase-specific recommendations
    if (phase === 'desensitization' && arousal > 0.8) {
      recommendations.push({
        type: 'bls-adjustment',
        priority: 'urgent',
        message: 'Необходимо замедлить билатеральную стимуляцию',
        instructions: [
          'Снизить скорость BLS',
          'Использовать более мягкий цвет',
          'Добавить короткие паузы'
        ],
        effectiveness: 0.9
      });
    }
    
    // Add AI-generated recommendations
    if (aiResponse.suggestedActions) {
      aiResponse.suggestedActions.forEach((action: string, index: number) => {
        recommendations.push({
          type: 'safety',
          priority: 'medium',
          message: action,
          instructions: [`Следуйте указанию: ${action}`],
          effectiveness: 0.6
        });
      });
    }
    
    return recommendations.slice(0, 5); // Limit to 5 recommendations
  }

  /**
   * Calculate BLS adjustments based on emotions
   */
  private calculateBLSAdjustments(emotionData: EmotionData): Partial<BLSConfiguration> {
    const { arousal, valence } = emotionData;
    const baseConfig = createDefaultBLSConfiguration();
    const adjustments: Partial<BLSConfiguration> = {
      audio: baseConfig.audio,
      haptics: baseConfig.haptics,
      rendering3D: baseConfig.rendering3D,
      transitions: baseConfig.transitions
    };
    
    // Speed adjustments
    if (arousal > 0.8) {
      adjustments.speed = Math.max(1, 5 - Math.floor(arousal * 4));
    } else if (arousal < 0.3) {
      adjustments.speed = Math.min(10, 5 + Math.floor((1 - arousal) * 3));
    }
    
    // Color adjustments based on valence
    if (valence < -0.5) {
      adjustments.color = '#10b981'; // Calming green
    } else if (valence > 0.5) {
      adjustments.color = '#3b82f6'; // Positive blue
    }
    
    // Pattern adjustments
    if (arousal > 0.7 && valence < -0.4) {
      adjustments.pattern = 'horizontal'; // Most calming
    } else if (arousal < 0.3) {
      adjustments.pattern = '3d-wave'; // More engaging
    }
    
    // Audio adjustments based on emotional state
    if (arousal > 0.8) {
      adjustments.audio = createDefaultBLSAudioConfig({
        enabled: true,
        audioType: 'white-noise',
        volume: 0.3 // Lower volume for high arousal
      });
    }
    
    return adjustments;
  }

  /**
   * Get default session guidance
   */
  private getDefaultSessionGuidance(phase: EMDRPhase): AISessionGuidance {
    const phaseInfo = this.emdrProtocol.phases.find(p => p.phase === phase);
    
    return {
      currentPhase: phase,
      phaseProgress: 0.5,
      recommendations: {
        immediate: ['Продолжить текущую фазу'],
        nextSteps: ['Мониторинг эмоционального состояния'],
        concerns: []
      },
      adaptiveBLS: createDefaultBLSConfiguration({
        speed: 5,
        pattern: 'horizontal',
        color: '#3b82f6',
        size: 20,
        soundEnabled: true,
        adaptiveMode: true,
        sessionPhase: phase
      }),
      estimatedTimeRemaining: phaseInfo?.typicalDuration || 10,
      readinessForNextPhase: {
        isReady: false,
        criteria: phaseInfo?.completionCriteria || [],
        missingCriteria: ['Требуется дополнительная оценка']
      }
    };
  }

  /**
   * Get default emotion response
   */
  private getDefaultEmotionResponse(emotionData: EmotionData, phase: EMDRPhase): AIEmotionResponse {
    return {
      recognizedEmotions: emotionData,
      emotionalState: this.analyze98EmotionalStates(emotionData),
      interventionLevel: 'mild',
      recommendations: [],
      blsAdjustments: createDefaultBLSConfiguration(),
      phaseTransitionAdvice: {
        canAdvance: false,
        shouldRegress: false,
        stayInPhase: true,
        reasoning: 'Продолжаем текущую фазу для стабилизации'
      }
    };
  }

  /**
   * Get enhanced default response
   */
  private getEnhancedDefaultResponse(sessionPhase: string): EnhancedAITherapistResponse {
    const phase = sessionPhase as EMDRPhase;
    
    return {
      phase,
      message: 'Продолжайте следить за движущимся объектом',
      suggestedBLS: createDefaultBLSConfiguration({
        speed: 5,
        pattern: 'horizontal',
        color: '#3b82f6',
        size: 20,
        soundEnabled: true,
        adaptiveMode: false,
        sessionPhase: phase
      }),
      emotionalAnalysis: {
        timestamp: Date.now(),
        arousal: 0.5,
        valence: 0.5,
        affects: {},
        basicEmotions: {},
        sources: {
          face: null,
          voice: null,
          combined: false
        },
        fusion: {
          confidence: 0.5,
          agreement: 0.5,
          dominantSource: 'balanced',
          conflictResolution: 'default fallback'
        },
        quality: {
          faceQuality: 0.5,
          voiceQuality: 0.5,
          environmentalNoise: 0.3,
          overallQuality: 0.5
        }
      },
      personalizedRecommendations: [],
      nextPhaseReadiness: {
        isReady: false,
        confidence: 0.5,
        reasoning: 'Требуется дополнительная оценка'
      }
    };
  }

  /**
   * Get affect arousal value (simplified mapping)
   */
  private getAffectArousal(affectName: string): number {
    const arousalMap: Record<string, number> = {
      'excited': 0.8, 'calm': 0.2, 'angry': 0.9, 'sad': 0.3,
      'happy': 0.6, 'fear': 0.8, 'surprise': 0.7, 'disgust': 0.6
    };
    return arousalMap[affectName.toLowerCase()] || 0.5;
  }

  /**
   * Get affect valence value (simplified mapping)
   */
  private getAffectValence(affectName: string): number {
    const valenceMap: Record<string, number> = {
      'happy': 0.8, 'sad': -0.7, 'angry': -0.6, 'fear': -0.8,
      'calm': 0.3, 'excited': 0.7, 'surprise': 0.1, 'disgust': -0.7
    };
    return valenceMap[affectName.toLowerCase()] || 0.0;
  }

  /**
   * Calculate intensity variance for stability score
   */
  private calculateIntensityVariance(affects: Record<string, number>): number {
    const values = Object.values(affects);
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  // Legacy helper methods (updated for compatibility)
  private generateTherapeuticMessage(emotionData: EmotionData, phase: string): string {
    // This method is now legacy - main logic moved to GPT-5 based methods
    return 'Продолжайте следить за движущимся объектом';
  }

  private getDefaultResponse(phase: string): AITherapistResponse {
    const emdrPhase = phase as EMDRPhase;
    return {
      phase: emdrPhase,
      message: 'Продолжайте следить за движущимся объектом',
      suggestedBLS: createDefaultBLSConfiguration({
        speed: 5,
        pattern: 'horizontal',
        color: '#3b82f6',
        size: 20,
        soundEnabled: true,
        adaptiveMode: false,
        sessionPhase: emdrPhase
      }),
      emotionalAnalysis: {
        timestamp: Date.now(),
        arousal: 0.5,
        valence: 0.5,
        affects: {},
        basicEmotions: {},
        sources: {
          face: null,
          voice: null,
          combined: false
        },
        fusion: {
          confidence: 0.5,
          agreement: 0.5,
          dominantSource: 'balanced',
          conflictResolution: 'default fallback'
        },
        quality: {
          faceQuality: 0.5,
          voiceQuality: 0.5,
          environmentalNoise: 0.3,
          overallQuality: 0.5
        }
      }
    };
  }

  private calculateOptimalSpeed(arousal: number): number {
    // Higher arousal -> slower speed for calming effect
    return Math.max(1, Math.min(10, 10 - Math.floor(arousal * 10)));
  }

  private selectPattern(valence: number, arousal: number): BLSConfiguration['pattern'] {
    if (arousal > 0.7) {
      return 'horizontal'; // Most calming
    } else if (valence < 0.3) {
      return 'diagonal'; // For negative emotions
    } else if (arousal < 0.3) {
      return '3d-wave'; // For engagement
    }
    return 'horizontal';
  }

  private selectColor(emotionData: EmotionData): string {
    const { valence } = emotionData;
    
    if (valence < 0.3) {
      return '#10b981'; // Green for calming
    } else if (valence > 0.7) {
      return '#3b82f6'; // Blue for positive
    }
    return '#8b5cf6'; // Purple for neutral
  }

  private calculateOptimalSize(arousal: number): number {
    // Higher arousal -> larger size for better focus
    return Math.max(15, Math.min(30, 15 + Math.floor(arousal * 15)));
  }

  // === Voice Processing Methods ===

  /**
   * Create enhanced user prompt with voice context
   */
  private createUserPrompt(message: string, context: AIChatContext, voiceContext?: VoiceContextData): string {
    let prompt = `Пациент говорит: "${message}"\n\nТекущая эмоциональная ситуация: arousal=${context.currentEmotionalState.arousal}, valence=${context.currentEmotionalState.valence}`;
    
    if (voiceContext) {
      prompt += `\n\nГолосовые характеристики:
- Интенсивность голоса: ${voiceContext.prosody.intensity.toFixed(2)}
- Темп речи: ${voiceContext.prosody.pace.toFixed(2)}
- Стабильность голоса: ${voiceContext.prosody.stability.toFixed(2)}
- Уровень стресса в голосе: ${voiceContext.voiceEmotions.stress.toFixed(2)}
- Уровень вовлеченности: ${voiceContext.voiceEmotions.engagement.toFixed(2)}
- Уверенность в голосе: ${voiceContext.voiceEmotions.confidence.toFixed(2)}`;
    }

    prompt += `\n\nОтвети как опытный EMDR терапевт. Формат ответа JSON: {"response": "ваш ответ", "confidence": 0.9, "suggestedActions": ["действие1", "действие2"], "criticalityLevel": "low|medium|high|crisis", "reasoning": "объяснение"}`;

    return prompt;
  }

  /**
   * Create specialized voice system prompt
   */
  private createVoiceSystemPrompt(context: AIChatContext, voiceContext: VoiceContextData): string {
    const anonymizedSessionId = this.anonymizeSessionId(context.sessionId);
    const emotionalCategory = this.categorizeEmotionalState(context.currentEmotionalState);
    const voiceAnalysis = this.analyzeVoiceContext(voiceContext);
    
    return `МЕДИЦИНСКИЙ ДИСКЛАЙМЕР: Я - AI-помощник терапевта, НЕ замещающий профессиональное лечение. При кризисе обращайтесь: 8-800-2000-122.

Вы - AI-помощник для ГОЛОСОВОЙ EMDR терапии под наблюдением лицензированного терапевта.

АНОНИМИЗИРОВАННЫЕ ДАННЫЕ:
- Сессия: ${anonymizedSessionId}
- Эмоциональная категория: ${emotionalCategory}
- Фаза: ${context.phaseContext.currentPhase}
- Время в фазе: ${Math.floor(context.phaseContext.timeInPhase)} минут

АНАЛИЗ ГОЛОСА:
- Эмоциональная интенсивность: ${voiceAnalysis.emotionalIntensity}
- Уровень стресса: ${voiceAnalysis.stressLevel}
- Вовлеченность: ${voiceAnalysis.engagementLevel}
- Тембр голоса: ${voiceAnalysis.voiceTone}
- Рекомендуемая адаптация ответа: ${voiceAnalysis.responseAdaptation}

СПЕЦИФИКА ГОЛОСОВОЙ ТЕРАПИИ:
1. Учитывайте просодические особенности речи пациента
2. Адаптируйте стиль ответа под эмоциональное состояние голоса
3. При высоком стрессе в голосе - используйте более успокаивающий тон
4. При низкой вовлеченности - используйте более теплый и поддерживающий стиль
5. Рекомендуйте подходящий голосовой стиль для TTS ответа

БЕЗОПАСНОСТЬ:
1. При кризисе в голосе - немедленная эскалация
2. Обращайте внимание на признаки диссоциации в речи
3. НЕ давать медицинских советов
4. При суицидальных интонациях - критический уровень

ЭКСТРЕННЫЕ КОНТАКТЫ:
- Телефон доверия: 8-800-2000-122
- Служба экстренной психологической помощи: 051

Ответы должны учитывать голосовой контекст и включать рекомендации по адаптации голосового ответа.`;
  }

  /**
   * Create specialized voice user prompt
   */
  private createVoiceUserPrompt(message: string, context: AIChatContext, voiceContext: VoiceContextData): string {
    const prosodyAnalysis = this.analyzeProsody(voiceContext);
    const emotionalIndicators = this.analyzeVoiceEmotions(voiceContext);
    
    return `Пациент говорит (голосом): "${message}"

КОНТЕКСТ ЭМОЦИОНАЛЬНОГО СОСТОЯНИЯ:
- Общий arousal: ${context.currentEmotionalState.arousal.toFixed(2)}
- Общий valence: ${context.currentEmotionalState.valence.toFixed(2)}

АНАЛИЗ ГОЛОСА:
${prosodyAnalysis}

ЭМОЦИОНАЛЬНЫЕ ИНДИКАТОРЫ В ГОЛОСЕ:
${emotionalIndicators}

ИНСТРУКЦИИ:
1. Проанализируйте соответствие между словами и голосом
2. Определите истинное эмоциональное состояние
3. Адаптируйте терапевтический ответ под голосовое состояние
4. Дайте рекомендации по голосовому стилю ответа (теплый/спокойный/поддерживающий)

Формат ответа JSON: {
  "response": "терапевтический ответ, учитывающий голосовой контекст",
  "confidence": 0.9,
  "suggestedActions": ["действие1", "действие2"],
  "criticalityLevel": "low|medium|high|crisis",
  "reasoning": "анализ голосового состояния и обоснование ответа",
  "recommendedVoiceStyle": "calming|warm|supportive|authoritative|gentle"
}`;
  }

  /**
   * Analyze voice context for crisis detection
   */
  private detectVoiceCrisis(voiceContext: VoiceContextData, aiResponse: any): CrisisDetection {
    let isCrisis = false;
    let riskLevel: CrisisDetection['riskLevel'] = 'none';
    let triggers: string[] = [];

    // Analyze prosody for crisis indicators
    if (voiceContext.prosody.stability < 0.3) {
      triggers.push('Нестабильность голоса');
      riskLevel = 'moderate';
    }

    // High stress with low engagement can indicate withdrawal/dissociation
    if (voiceContext.voiceEmotions.stress > 0.8 && voiceContext.voiceEmotions.engagement < 0.3) {
      isCrisis = true;
      riskLevel = 'high';
      triggers.push('Высокий стресс с низкой вовлеченностью');
    }

    // Very low authenticity might indicate emotional detachment
    if (voiceContext.voiceEmotions.authenticity < 0.4) {
      triggers.push('Эмоциональная отстраненность в голосе');
      riskLevel = riskLevel === 'none' ? 'moderate' : riskLevel;
    }

    // Very high uncertainty with high stress
    if (voiceContext.voiceEmotions.uncertainty > 0.8 && voiceContext.voiceEmotions.stress > 0.7) {
      isCrisis = true;
      riskLevel = 'severe';
      triggers.push('Критическая неопределенность и стресс');
    }

    // AI-detected crisis
    if (aiResponse.criticalityLevel === 'crisis') {
      isCrisis = true;
      riskLevel = 'severe';
      triggers.push('AI-детекция кризиса по голосу');
    }

    return {
      isCrisis,
      riskLevel,
      triggers,
      interventions: {
        immediate: isCrisis ? [
          'Голосовые техники заземления',
          'Синхронизация дыхания с голосом',
          'Успокаивающий голосовой ответ'
        ] : [],
        escalation: riskLevel === 'severe' ? [
          'Немедленная голосовая поддержка',
          'Связь с терапевтом',
          'Кризисный голосовой протокол'
        ] : [],
        contacts: isCrisis ? [
          'Лечащий терапевт',
          'Кризисная служба'
        ] : []
      },
      monitoring: {
        increaseFrequency: riskLevel !== 'none',
        alertTherapist: riskLevel === 'high' || riskLevel === 'severe',
        requireSupervision: isCrisis
      }
    };
  }

  /**
   * Analyze voice context for therapeutic insights
   */
  private analyzeVoiceContext(voiceContext: VoiceContextData): {
    emotionalIntensity: string;
    stressLevel: string;
    engagementLevel: string;
    voiceTone: string;
    responseAdaptation: string;
  } {
    const { prosody, voiceEmotions } = voiceContext;

    // Determine emotional intensity
    const intensity = prosody.intensity > 0.7 ? 'высокая' : 
                     prosody.intensity > 0.4 ? 'средняя' : 'низкая';

    // Determine stress level
    const stress = voiceEmotions.stress > 0.7 ? 'высокий' :
                   voiceEmotions.stress > 0.4 ? 'средний' : 'низкий';

    // Determine engagement
    const engagement = voiceEmotions.engagement > 0.7 ? 'высокая' :
                       voiceEmotions.engagement > 0.4 ? 'средняя' : 'низкая';

    // Determine voice tone
    const tone = prosody.stability > 0.7 && voiceEmotions.confidence > 0.6 ? 'стабильный' :
                 voiceEmotions.stress > 0.6 ? 'напряженный' :
                 voiceEmotions.fatigue > 0.6 ? 'усталый' : 'нестабильный';

    // Determine response adaptation needed
    let adaptation = 'стандартная';
    if (voiceEmotions.stress > 0.7) {
      adaptation = 'успокаивающая';
    } else if (voiceEmotions.engagement < 0.4) {
      adaptation = 'активизирующая';
    } else if (voiceEmotions.uncertainty > 0.6) {
      adaptation = 'поддерживающая';
    }

    return {
      emotionalIntensity: intensity,
      stressLevel: stress,
      engagementLevel: engagement,
      voiceTone: tone,
      responseAdaptation: adaptation
    };
  }

  /**
   * Analyze prosody details
   */
  private analyzeProsody(voiceContext: VoiceContextData): string {
    const { prosody } = voiceContext;
    
    return `- Возбуждение (arousal): ${prosody.arousal.toFixed(2)} ${prosody.arousal > 0.7 ? '(высокое)' : prosody.arousal < 0.3 ? '(низкое)' : '(среднее)'}
- Валентность (valence): ${prosody.valence.toFixed(2)} ${prosody.valence > 0.3 ? '(позитивная)' : prosody.valence < -0.3 ? '(негативная)' : '(нейтральная)'}
- Интенсивность: ${prosody.intensity.toFixed(2)} ${prosody.intensity > 0.7 ? '(высокая)' : '(умеренная)'}
- Темп речи: ${prosody.pace.toFixed(2)} ${prosody.pace > 0.7 ? '(быстрый)' : prosody.pace < 0.3 ? '(медленный)' : '(нормальный)'}
- Стабильность: ${prosody.stability.toFixed(2)} ${prosody.stability < 0.4 ? '(нестабильный голос)' : '(стабильный)'}`;
  }

  /**
   * Analyze voice emotions
   */
  private analyzeVoiceEmotions(voiceContext: VoiceContextData): string {
    const { voiceEmotions } = voiceContext;
    
    return `- Стресс: ${voiceEmotions.stress.toFixed(2)} ${voiceEmotions.stress > 0.7 ? '(высокий)' : '(умеренный)'}
- Вовлеченность: ${voiceEmotions.engagement.toFixed(2)} ${voiceEmotions.engagement < 0.4 ? '(низкая)' : '(нормальная)'}
- Уверенность: ${voiceEmotions.confidence.toFixed(2)} ${voiceEmotions.confidence < 0.5 ? '(низкая)' : '(нормальная)'}
- Усталость: ${voiceEmotions.fatigue.toFixed(2)} ${voiceEmotions.fatigue > 0.6 ? '(высокая)' : '(низкая)'}
- Неопределенность: ${voiceEmotions.uncertainty.toFixed(2)} ${voiceEmotions.uncertainty > 0.6 ? '(высокая)' : '(низкая)'}
- Аутентичность: ${voiceEmotions.authenticity.toFixed(2)} ${voiceEmotions.authenticity < 0.5 ? '(низкая - возможна маскировка)' : '(нормальная)'}`;
  }

  /**
   * Get safety techniques for current phase
   */
  private getSafetyTechniquesForPhase(phase: EMDRPhase): string[] {
    const baseTechniques = [
      'ТЕХНИКА БЕЗОПАСНОГО МЕСТА (ПРИ ВЫСОКОЙ ТРЕВОЖНОСТИ):',
      '1. Закройте глаза и сделайте глубокий вдох',
      '2. Представьте место, где вы чувствуете себя в полной безопасности',
      '3. Это может быть реальное или воображаемое место',
      '4. Обратите внимание на детали: цвета, звуки, запахи, ощущения',
      '5. Почувствуйте спокойствие и защищенность',
      '6. Оставайтесь в этом месте столько, сколько нужно',
      'ДЫХАТЕЛЬНАЯ ТЕХНИКА "4-7-8":',
      '1. Вдох на 4 счета через нос',
      '2. Задержка дыхания на 7 счетов',
      '3. Выдох на 8 счетов через рот',
      '4. Повторить 4-6 раз',
      'РЕСУРСНЫЕ СОСТОЯНИЯ:',
      '- Воспоминания о любви и поддержке',
      '- Моменты силы и успеха',
      '- Ощущение собственной ценности',
      '- Контакт с природой и красотой'
    ];

    const phaseTechniques: Record<EMDRPhase, string[]> = {
      'preparation': [
        'ПОДГОТОВКА: Создание базового образа безопасного места',
        '- Опишите это место вслух',
        '- Поработайте над деталями',
        '- Свяжите с позитивными ресурсами'
      ],
      'assessment': [
        'ОЦЕНКА: Проверка доступности безопасного места',
        '- Проверьте стабильность образа',
        '- Оцените скорость активации'
      ],
      'desensitization': [
        'ДЕСЕНСИБИЛИЗАЦИЯ: Моментальная активация при перегрузке',
        '- Немедленно при SUD > 8',
        '- Остановка BLS и переход к стабилизации'
      ],
      'installation': [
        'ИНСТАЛЛЯЦИЯ: Укрепление позитивных ресурсов',
        '- Сочетание с позитивным убеждением'
      ],
      'body-scan': [
        'СКАНИРОВАНИЕ ТЕЛА: Проверка соматической стабильности'
      ],
      'closure': [
        'ЗАКРЫТИЕ: Обязательное возвращение к безопасному месту',
        '- Полная стабилизация перед завершением'
      ],
      'reevaluation': [
        'ПЕРЕОЦЕНКА: Проверка сохранности ресурсов'
      ],
      'integration': [
        'ИНТЕГРАЦИЯ: Самостоятельная активация безопасного места'
      ]
    };

    return [...baseTechniques, ...phaseTechniques[phase]];
  }

  /**
   * Get grounding techniques for current phase
   */
  private getGroundingTechniquesForPhase(phase: EMDRPhase): string[] {
    const baseTechniques = [
      'GROUNDING ТЕХНИКИ (ПРИ ДИССОЦИАЦИИ):',
      'ТЕХНИКА "5-4-3-2-1":',
      '1. Назовите 5 вещей, которые вы ВИДИТЕ',
      '2. Назовите 4 вещи, которые вы СЛЫШИТЕ',
      '3. Назовите 3 вещи, которые вы ОЩУЩАЕТЕ (кожей)',
      '4. Назовите 2 запаха, которые вы ЧУВСТВУЕТЕ',
      '5. Назовите 1 вкус, который вы ОЩУЩАЕТЕ',
      'ФИЗИЧЕСКОЕ ЗАЗЕМЛЕНИЕ:',
      '1. Почувствуйте опору ног о пол',
      '2. Почувствуйте спину на стуле',
      '3. Обратите внимание на вес своего тела',
      '4. Пожмите руки и почувствуйте напряжение',
      '5. Мягко похлопайте себя по бедрам',
      'ОРИЕНТАЦИЯ В ПРОСТРАНСТВЕ И ВРЕМЕНИ:',
      '1. Назовите свое имя',
      '2. Назовите, где вы находитесь',
      '3. Назовите сегодняшнюю дату',
      '4. Назовите день недели',
      '5. Опишите погоду за окном',
      'КОНТАКТ С РЕАЛЬНОСТЬЮ (ПРИ ДЕРЕАЛИЗАЦИИ):',
      '1. Откройте глаза, если они закрыты',
      '2. Подвигайте пальцами ног',
      '3. Пошевелите плечами',
      '4. Сделайте несколько глубоких вдохов и выдохов'
    ];

    const phaseTechniques: Record<EMDRPhase, string[]> = {
      'preparation': [
        'ПОДГОТОВКА: Обучение базовым техникам заземления'
      ],
      'assessment': [
        'ОЦЕНКА: Проверка диссоциативных симптомов',
        '- При появлении туманности - немедленное grounding'
      ],
      'desensitization': [
        'ДЕСЕНСИБИЛИЗАЦИЯ: Мониторинг диссоциации каждые 30 секунд',
        '- При потере контакта - STOP BLS',
        '- Немедленное восстановление ориентации'
      ],
      'installation': [
        'ИНСТАЛЛЯЦИЯ: Мягкое grounding для интеграции'
      ],
      'body-scan': [
        'СКАНИРОВАНИЕ ТЕЛА: Последовательное сканирование всех частей тела'
      ],
      'closure': [
        'ЗАКРЫТИЕ: Обязательное grounding перед завершением'
      ],
      'reevaluation': [
        'ПЕРЕОЦЕНКА: Проверка сохранности навыков grounding'
      ],
      'integration': [
        'ИНТЕГРАЦИЯ: Автоматизация навыков заземления'
      ]
    };

    return [...baseTechniques, ...phaseTechniques[phase]];
  }

  /**
   * Calculate optimal warmth for therapeutic voice
   */
  private calculateOptimalWarmth(voiceContext: VoiceContextData): number {
    const { voiceEmotions } = voiceContext;
    
    // Higher stress or lower engagement requires more warmth
    let warmth = 0.7; // Base warmth
    
    if (voiceEmotions.stress > 0.6) warmth += 0.2;
    if (voiceEmotions.engagement < 0.4) warmth += 0.15;
    if (voiceEmotions.uncertainty > 0.6) warmth += 0.1;
    
    return Math.min(1.0, warmth);
  }

  /**
   * Calculate optimal pace for therapeutic voice
   */
  private calculateOptimalPace(voiceContext: VoiceContextData): 'slow' | 'normal' | 'fast' {
    const { prosody, voiceEmotions } = voiceContext;
    
    // High stress or fast speech requires slower response
    if (voiceEmotions.stress > 0.7 || prosody.pace > 0.8) {
      return 'slow';
    }
    
    // Low engagement might benefit from normal pace
    if (voiceEmotions.engagement < 0.4) {
      return 'normal';
    }
    
    return 'normal';
  }

  /**
   * Calculate optimal empathy level
   */
  private calculateOptimalEmpathy(voiceContext: VoiceContextData, emotionData: EmotionData): number {
    const { voiceEmotions } = voiceContext;
    
    // Base empathy
    let empathy = 0.8;
    
    // Increase empathy for distress
    if (voiceEmotions.stress > 0.6) empathy += 0.1;
    if (emotionData.valence < -0.5) empathy += 0.1;
    if (voiceEmotions.authenticity < 0.5) empathy += 0.05; // Possible emotional hiding
    
    return Math.min(1.0, empathy);
  }

  /**
   * Get Russian cultural techniques for EMDR therapy
   */
  private getRussianCulturalTechniques(phase: EMDRPhase): string[] {
    const culturalTechniques = [
      '🇷🇺 КУЛЬТУРНО-АДАПТИРОВАННЫЕ ТЕХНИКИ ДЛЯ РУССКОЯЗЫЧНЫХ ПАЦИЕНТОВ:',
      '',
      '🌲 ТЕХНИКА "РУССКИЙ ЛЕС" (Безопасное место):',
      '"Представьте себя в тихом русском лесу..."',
      '- Высокие сосны и берёзы создают защитный шатёр над вами',
      '- Мягкий мох под ногами, как пушистый ковёр',
      '- Запах хвои и свежего воздуха наполняет лёгкие',
      '- Пение птиц и шелест листьев успокаивают душу',
      '- Солнечные лучи мягко пробиваются сквозь кроны',
      '- Вы в полной безопасности в этом природном храме',
      '',
      '🏠 ТЕХНИКА "БАБУШКИН ДОМ" (Ресурсное место):',
      '"Вспомните дом, где всегда ждут и любят..."',
      '- Тёплая печь или батарея, от которой идёт живое тепло',
      '- Запах домашней выпечки и горячего чая',
      '- Мягкие руки, которые всегда готовы обнять',
      '- Уютные пледы и подушки, в которые можно укутаться',
      '- Голоса близких людей, полные любви и заботы',
      '- Ощущение полной принятости и понимания',
      '',
      '🏞️ ТЕХНИКА "РУССКАЯ РЕКА" (Поток переработки):',
      '"Пусть река унесёт то, что больше не нужно..."',
      '- Широкая спокойная река течёт через ваше сознание',
      '- Тяжёлые переживания - как листья, упавшие в воду',
      '- Река мягко подхватывает их и уносит прочь',
      '- Вы стоите на берегу в безопасности',
      '- Чистая вода омывает и очищает память',
      '- На том берегу уже светит солнце новой жизни',
      '',
      '⛪ ТЕХНИКА "ДУШИ ПОКОЙ" (Духовное ресурсирование):',
      '"Для тех, кому близки духовные традиции..."',
      '- Представьте тихое святое место (церковь, храм природы)',
      '- Ощутите присутствие высшей защитной силы',
      '- Свет, который мягко обволакивает и оберегает',
      '- Чувство глубокого покоя и защищённости',
      '- Связь с чем-то большим, мудрым и любящим',
      '- "Да будет воля Твоя, Господи, во благо"',
      '',
      '🎭 ТЕХНИКА "РУССКАЯ МАТРЁШКА" (Интеграция частей личности):',
      '"Каждая матрёшка - это часть вас, все они важны..."',
      '- Большая матрёшка - это ваша взрослая мудрая часть',
      '- Меньшие матрёшки - части, которые нуждаются в исцелении',
      '- Бережно откройте каждую, с пониманием и любовью',
      '- Обнимите каждую часть: "Ты важна, я забочусь о тебе"',
      '- Мудро соберите всё в единое целое',
      '- Вы - целостная, многогранная личность',
      '',
      '❄️ ТЕХНИКА "ПЕРВЫЙ СНЕГ" (Новые начинания):',
      '"Как первый снег покрывает старые следы..."',
      '- Представьте, как мягкий снег укрывает всё вокруг',
      '- Старые болезненные следы исчезают под белым покрывалом',
      '- Мир становится чистым, свежим, полным возможностей',
      '- Вы можете оставить новые следы - следы исцеления',
      '- Морозный воздух наполняет лёгкие чистотой',
      '- Впереди - новая дорога, новая жизнь'
    ];

    const phaseSpecific: Record<EMDRPhase, string[]> = {
      'preparation': [
        'Фаза подготовки: Используйте "Русский лес" для создания безопасности',
        'Установите связь с природными образами силы'
      ],
      'assessment': [
        'Фаза оценки: "Матрёшка" поможет понять разные части травмы',
        'Каждая часть имеет право на существование и исцеление'
      ],
      'desensitization': [
        'Фаза переработки: "Русская река" для безопасного отпускания',
        'Пусть вода унесёт боль, оставив мудрость'
      ],
      'installation': [
        'Фаза усиления: "Бабушкин дом" для укрепления ресурсов',
        'Впитайте любовь и принятие в каждую клеточку'
      ],
      'body-scan': [
        'Сканирование тела: "Снежинка на ладони" для телесного контакта',
        'Ваше тело - мудрый храм, который знает путь к исцелению'
      ],
      'closure': [
        'Закрытие: "Первый снег" для завершения на светлой ноте',
        'Благословите пройденный путь'
      ],
      'reevaluation': [
        'Переоценка: Проверьте устойчивость всех образов силы',
        'Какие культурные метафоры лучше всего поддерживают?'
      ],
      'integration': [
        'Интеграция: Соедините все техники в единую систему самопомощи',
        'Создайте свой культурный "набор первой помощи"'
      ]
    };

    return [...culturalTechniques, '', '🎯 ПРИМЕНЕНИЕ В ТЕКУЩЕЙ ФАЗЕ:', ...phaseSpecific[phase]];
  }

  /**
   * Get Russian EMDR protocol phrases
   */
  private getEMDRRussianPhrases(phase: EMDRPhase): string[] {
    const basePhrasesMap: Record<EMDRPhase, string[]> = {
      'preparation': [
        '📋 ФРАЗЫ ДЛЯ ФАЗЫ ПОДГОТОВКИ:',
        '"Мы начинаем очень бережно. Вы в полной безопасности."',
        '"Какие ресурсы помогают вам чувствовать себя сильнее?"',
        '"Что поможет вам сохранить устойчивость во время работы?"',
        '"Создадим вместе ваше особое безопасное место..."'
      ],
      'assessment': [
        '📋 ФРАЗЫ ДЛЯ ФАЗЫ ОЦЕНКИ:',
        '"Что приходит сейчас, когда вы думаете об этом?"',
        '"Как вы оцениваете уровень беспокойства от 0 до 10?"',
        '"Что ваше тело говорит вам в этот момент?"',
        '"Какие мысли о себе возникают вместе с этим образом?"',
        '"Насколько истинными ощущаются эти позитивные слова о себе?"'
      ],
      'desensitization': [
        '📋 ФРАЗЫ ДЛЯ ФАЗЫ ПЕРЕРАБОТКИ:',
        '"Следите за движением и позвольте происходить тому, что происходит."',
        '"Что приходит сейчас?" (главная фраза для мониторинга)',
        '"Просто заметьте и отпустите."',
        '"Пусть ваш разум идёт туда, куда ему нужно."',
        '"Заметили ли вы какие-то изменения?"',
        '"Как это ощущается сейчас?"',
        '"Дышите и позвольте этому пройти сквозь вас."'
      ],
      'installation': [
        '📋 ФРАЗЫ ДЛЯ ФАЗЫ УСИЛЕНИЯ:',
        '"Удерживайте эти позитивные слова о себе и следите за движением."',
        '"Как сильно вы чувствуете истинность этих слов сейчас?"',
        '"Позвольте этой силе распространиться по всему телу."',
        '"Пусть эта уверенность станет частью вас."'
      ],
      'body-scan': [
        '📋 ФРАЗЫ ДЛЯ СКАНИРОВАНИЯ ТЕЛА:',
        '"Мысленно просканируйте своё тело от головы до ног."',
        '"Что вы замечаете в своём теле сейчас?"',
        '"Есть ли где-то напряжение или дискомфорт?"',
        '"Позвольте этому ощущению быть и проследите, как оно меняется."'
      ],
      'closure': [
        '📋 ФРАЗЫ ДЛЯ ЗАКРЫТИЯ:',
        '"Мы подходим к завершению нашей работы сегодня."',
        '"Вернитесь в ваше безопасное место и отдохните там."',
        '"Поблагодарите себя за смелость и проделанную работу."',
        '"Вы прошли важный путь сегодня."'
      ],
      'reevaluation': [
        '📋 ФРАЗЫ ДЛЯ ПЕРЕОЦЕНКИ:',
        '"Как вы чувствуете себя с тем воспоминанием сейчас?"',
        '"Что изменилось с прошлого раза?"',
        '"Насколько беспокоящим это кажется теперь?"',
        '"Какие новые понимания пришли к вам?"'
      ],
      'integration': [
        '📋 ФРАЗЫ ДЛЯ ИНТЕГРАЦИИ:',
        '"Как эти изменения отражаются в вашей повседневной жизни?"',
        '"Что вы возьмёте с собой из этого опыта?"',
        '"Как вы будете заботиться о себе в будущем?"',
        '"Вы готовы быть сами себе добрым наставником?"'
      ]
    };

    const universalPhrases = [
      '',
      '🌟 УНИВЕРСАЛЬНЫЕ ПОДДЕРЖИВАЮЩИЕ ФРАЗЫ:',
      '"Я здесь с вами. Вы не одни."',
      '"Это нормально - чувствовать то, что вы чувствуете."',
      '"Ваши переживания важны и имеют право на существование."',
      '"Мы идём в вашем темпе, без спешки."',
      '"Вы проявляете большую смелость."',
      '"Доверьтесь мудрости своего тела и души."',
      '',
      '🚨 ФРАЗЫ ДЛЯ КРИЗИСНЫХ СИТУАЦИЙ:',
      '"Стоп. Вернёмся в безопасность." (при overwhelming)',
      '"Вы здесь, со мной, в этой комнате, в безопасности." (при диссоциации)',
      '"Дышите со мной. Вдох... выдох..." (при панике)',
      '"Это воспоминание, оно уже в прошлом." (при флэшбеках)',
      '',
      '💫 ФРАЗЫ ДЛЯ ГОЛОСОВОГО ИНТЕРФЕЙСА:',
      '(Медленно, тепло): "Что... приходит... сейчас?"',
      '(Успокаивающе): "Просто... заметьте... и отпустите."',
      '(Поддерживающе): "Вы... делаете... прекрасную... работу."',
      '(Нежно): "Позвольте... себе... отдохнуть... в безопасности."'
    ];

    return [...basePhrasesMap[phase], ...universalPhrases];
  }

  /**
   * Get adaptive recommendations based on arousal and valence
   */
  private getAdaptiveRecommendations(arousal: number, valence: number, phase: EMDRPhase): string {
    let recommendations = [];
    
    // High arousal recommendations (> 0.7)
    if (arousal > 0.8) {
      recommendations.push('🔴 КРИТИЧЕСКОЕ ВОЗБУЖДЕНИЕ - НЕМЕДЛЕННЫЕ ДЕЙСТВИЯ:');
      recommendations.push('- ОСТАНОВИТЬ БЛС (билатеральную стимуляцию)');
      recommendations.push('- Активировать технику безопасного места');
      recommendations.push('- Применить дыхательную технику "Квадрат"');
      recommendations.push('- "Давайте остановимся и перейдём в ваше безопасное место"');
    } else if (arousal > 0.7) {
      recommendations.push('🟡 ВЫСОКОЕ ВОЗБУЖДЕНИЕ - СНИЖЕНИЕ ИНТЕНСИВНОСТИ:');
      recommendations.push('- Замедлить БЛС в 2 раза');
      recommendations.push('- Предложить технику безопасного места');
      recommendations.push('- Использовать образы русской природы для успокоения');
    }
    
    // Low arousal recommendations (< 0.3) - диссоциация
    if (arousal < 0.2) {
      recommendations.push('🔵 КРИТИЧЕСКАЯ ДИССОЦИАЦИЯ - ЭКСТРЕННОЕ ЗАЗЕМЛЕНИЕ:');
      recommendations.push('- ПРИОСТАНОВИТЬ БЛС');
      recommendations.push('- Немедленная техника "5-4-3-2-1"');
      recommendations.push('- Физическое заземление "Снежинка на ладони"');
      recommendations.push('- "Где вы сейчас? Какое сегодня число?"');
    } else if (arousal < 0.3) {
      recommendations.push('🟦 ДИССОЦИАЦИЯ - МЯГКОЕ ЗАЗЕМЛЕНИЕ:');
      recommendations.push('- Техника заземления "Корни дерева"');
      recommendations.push('- Ориентация в пространстве и времени');
      recommendations.push('- Контакт с телесными ощущениями');
    }
    
    // Negative valence recommendations (< -0.5)
    if (valence < -0.7) {
      recommendations.push('🖤 СИЛЬНЫЙ НЕГАТИВНЫЙ АФФЕКТ:');
      recommendations.push('- Ресурсирование через "Бабушкин дом"');
      recommendations.push('- Активация позитивных воспоминаний');
      recommendations.push('- Техника "Души покой" при необходимости');
    }
    
    // Optimal window recommendations
    if (arousal >= 0.3 && arousal <= 0.7 && valence > -0.3) {
      recommendations.push('✅ ОПТИМАЛЬНОЕ ОКНО ТОЛЕРАНТНОСТИ:');
      recommendations.push('- Продолжить текущую фазу EMDR');
      recommendations.push('- Мониторинг: "Что приходит сейчас?"');
      recommendations.push('- Готовность к переходу на следующую фазу');
    }
    
    return recommendations.join('\n');
  }

  /**
   * Interpret arousal level
   */
  private interpretArousal(arousal: number): string {
    if (arousal > 0.8) return '(КРИТИЧЕСКИ ВЫСОКИЙ - немедленная стабилизация)';
    if (arousal > 0.7) return '(высокий - нужно снижение)';
    if (arousal > 0.4) return '(средний - норма)';
    if (arousal > 0.2) return '(низкий - лёгкое заземление)';
    return '(КРИТИЧЕСКИ НИЗКИЙ - экстренное заземление)';
  }

  /**
   * Interpret valence level
   */
  private interpretValence(valence: number): string {
    if (valence > 0.5) return '(позитивный - хорошо)';
    if (valence > 0) return '(слегка позитивный)';
    if (valence > -0.3) return '(нейтральный)';
    if (valence > -0.6) return '(негативный - нужна поддержка)';
    return '(сильно негативный - активное ресурсирование)';
  }

  /**
   * Get emotional quadrant
   */
  private getEmotionalQuadrant(arousal: number, valence: number): string {
    if (arousal > 0.5 && valence > 0) return 'Активация (высокая энергия + позитив)';
    if (arousal > 0.5 && valence < 0) return 'Стресс (высокая энергия + негатив)';
    if (arousal < 0.5 && valence > 0) return 'Спокойствие (низкая энергия + позитив)';
    if (arousal < 0.5 && valence < 0) return 'Депрессия/Диссоциация (низкая энергия + негатив)';
    return 'Нейтральное состояние';
  }
}

// Export singleton instance
export const backendAITherapist = new BackendAITherapistService();

