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
    context: AIChatContext
  ): Promise<AITherapistMessage> {
    try {
      const systemPrompt = this.createChatSystemPrompt(context);
      const userPrompt = `Пациент говорит: "${message}"\n\nТекущая эмоциональная ситуация: arousal=${context.currentEmotionalState.arousal}, valence=${context.currentEmotionalState.valence}\n\nОтвети как опытный EMDR терапевт. Формат ответа JSON: {"response": "ваш ответ", "confidence": 0.9, "suggestedActions": ["действие1", "действие2"], "criticalityLevel": "low|medium|high|crisis"}`;

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
          criticalityLevel: aiResponse.criticalityLevel || 'low'
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
    return `ВАЖНЫЕ МЕДИЦИНСКИЕ ДИСКЛАЙМЕРЫ:
- Я НЕ являюсь заменой профессиональному медицинскому лечению
- В случае суицидальных мыслей НЕМЕДЛЕННО обратитесь за помощью: 8-800-2000-122 (телефон доверия)
- При острых состояниях обратитесь к врачу или в службу экстренной психологической помощи
- Данное взаимодействие носит вспомогательный характер и не является медицинской консультацией

Вы - AI-помощник терапевта, специализирующийся на поддержке EMDR протокола. Вы предоставляете информационную поддержку под наблюдением квалифицированного специалиста.

ТЕКУЩАЯ ФАЗА: ${phase} - ${phaseInfo?.name || 'Обработка'}
ОПИСАНИЕ ФАЗЫ: ${phaseInfo?.description || 'Обработка травматичного материала'}
ЦЕЛИ ФАЗЫ: ${phaseInfo?.goals?.join(', ') || 'Снижение дистресса'}
КРИТЕРИИ ЗАВЕРШЕНИЯ: ${phaseInfo?.completionCriteria?.join(', ') || 'Стабилизация состояния'}

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

РЕФЬЮЗАЛ ПАТТЕРНЫ:
- НЕ даю медицинские диагнозы
- НЕ назначаю лечение или медикаменты
- НЕ замещаю профессиональную терапию
- НЕ работаю с кризисными состояниями без специалиста

ВАШ ОТВЕТ ДОЛЖЕН БЫТЬ В JSON ФОРМАТЕ и включать:
- therapeuticMessage: поддерживающее сообщение с напоминанием о дисклаймере
- confidence: уверенность в безопасности ответа (0-1)
- phaseProgress: прогресс фазы (0-1)
- readyForNextPhase: готовность к следующей фазе
- immediateRecommendations: безопасные рекомендации
- crisisAlert: уровень тревоги (none/mild/moderate/crisis)
- referralNeeded: необходимость направления к специалисту

Говорите тепло, поддерживающе, с обязательными дисклаймерами о безопасности.`;
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
    const historyContext = sessionHistory.length > 0 ? 
      `\nИстория сессии: последние ${sessionHistory.length} взаимодействий показывают тенденцию.` : 
      '\nЭто начало сессии.';

    return `АНАЛИЗ ЭМОЦИОНАЛЬНОГО СОСТОЯНИЯ:
${emotionSummary}

ТЕКУЩАЯ ФАЗА: ${phase}
${historyContext}

ЗАПРОС: Проанализируйте текущее эмоциональное состояние пациента и предоставьте терапевтический ответ, соответствующий текущей фазе EMDR. Учтите уровень arousal и valence, определите необходимые интервенции и рекомендации по БЛС.

Особое внимание на:
1. Признаки диссоциации (очень низкий arousal)
2. Эмоциональное затопление (очень высокий arousal + низкий valence)
3. Готовность к переходу к следующей фазе
4. Необходимость в техниках заземления

Ответ должен быть профессиональным, поддерживающим и безопасным.`;
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
      
      return {
        speed: aiResponse.speed || this.calculateOptimalSpeed(arousalLevel),
        pattern: aiResponse.pattern || this.selectPattern(valenceLevel, arousalLevel),
        color: aiResponse.color || this.selectColor(emotionData),
        size: aiResponse.size || this.calculateOptimalSize(arousalLevel),
        soundEnabled: aiResponse.soundEnabled ?? (arousalLevel > 0.7),
        adaptiveMode: true
      };
    } catch (error) {
      console.error('AI BLS generation error:', error);
      // Fallback to rule-based algorithm
      return {
        speed: this.calculateOptimalSpeed(arousalLevel),
        pattern: this.selectPattern(valenceLevel, arousalLevel),
        color: this.selectColor(emotionData),
        size: this.calculateOptimalSize(arousalLevel),
        soundEnabled: arousalLevel > 0.7,
        adaptiveMode: true
      };
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
    const adjustments: Partial<BLSConfiguration> = {};
    
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
      adaptiveBLS: {
        speed: 5,
        pattern: 'horizontal',
        color: '#3b82f6',
        size: 20,
        soundEnabled: true,
        adaptiveMode: true
      },
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
      blsAdjustments: {},
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
      suggestedBLS: {
        speed: 5,
        pattern: 'horizontal',
        color: '#3b82f6',
        size: 20,
        soundEnabled: true,
        adaptiveMode: false
      },
      emotionalAnalysis: {
        timestamp: Date.now(),
        arousal: 0.5,
        valence: 0.5,
        affects: {},
        basicEmotions: {}
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
    return {
      phase: phase as EMDRPhase,
      message: 'Продолжайте следить за движущимся объектом',
      suggestedBLS: {
        speed: 5,
        pattern: 'horizontal',
        color: '#3b82f6',
        size: 20,
        soundEnabled: true,
        adaptiveMode: false
      },
      emotionalAnalysis: {
        timestamp: Date.now(),
        arousal: 0.5,
        valence: 0.5,
        affects: {},
        basicEmotions: {}
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
}

// Singleton instance
export const backendAITherapist = new BackendAITherapistService();