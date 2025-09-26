/**
 * TTS Provider Initialization Test
 * Tests that all TTS providers can initialize without errors
 */

import { ElevenLabsTTSProvider } from './services/voice/providers/elevenlabsTTSProvider';
import { GoogleCloudTTSProvider } from './services/voice/googleCloudTTSProvider';
import { WebSpeechTTSProvider } from './services/voice/webSpeechTTSProvider';

async function testTTSProviders() {
  console.log('🧪 Testing TTS Provider Initialization...');
  
  const results = {
    elevenlabs: { success: false, error: null as any },
    googleCloud: { success: false, error: null as any },
    webSpeech: { success: false, error: null as any }
  };

  // Test ElevenLabs Provider
  try {
    console.log('📡 Testing ElevenLabs provider...');
    const elevenLabsProvider = new ElevenLabsTTSProvider();
    await elevenLabsProvider.initialize();
    results.elevenlabs.success = elevenLabsProvider.isAvailable();
    console.log('✅ ElevenLabs provider initialized successfully');
    console.log('📊 ElevenLabs status:', elevenLabsProvider.getStatus());
    await elevenLabsProvider.cleanup();
  } catch (error) {
    results.elevenlabs.error = error;
    console.error('❌ ElevenLabs provider failed:', error);
  }

  // Test Google Cloud Provider
  try {
    console.log('📡 Testing Google Cloud provider...');
    const googleProvider = new GoogleCloudTTSProvider();
    await googleProvider.initialize();
    results.googleCloud.success = googleProvider.isAvailable();
    console.log('✅ Google Cloud provider initialized successfully');
    console.log('📊 Google Cloud status:', googleProvider.getStatus());
    await googleProvider.cleanup();
  } catch (error) {
    results.googleCloud.error = error;
    console.error('❌ Google Cloud provider failed:', error);
  }

  // Test Web Speech Provider
  try {
    console.log('📡 Testing Web Speech provider...');
    const webSpeechProvider = new WebSpeechTTSProvider();
    await webSpeechProvider.initialize();
    results.webSpeech.success = webSpeechProvider.isAvailable();
    console.log('✅ Web Speech provider initialized successfully');
    console.log('📊 Web Speech status:', webSpeechProvider.getStatus());
    await webSpeechProvider.cleanup();
  } catch (error) {
    results.webSpeech.error = error;
    console.error('❌ Web Speech provider failed:', error);
  }

  // Summary
  console.log('\n🔍 TTS Provider Test Results:');
  console.log('================================');
  
  for (const [provider, result] of Object.entries(results)) {
    if (result.success) {
      console.log(`✅ ${provider}: PASSED`);
    } else {
      console.log(`❌ ${provider}: FAILED`);
      if (result.error) {
        console.log(`   Error: ${result.error.message || result.error}`);
      }
    }
  }

  const successCount = Object.values(results).filter(r => r.success).length;
  console.log(`\n📈 Overall: ${successCount}/3 providers initialized successfully`);
  
  return results;
}

// Export for testing
export { testTTSProviders };

// Run test if this file is executed directly
if (import.meta.url.includes('test-tts-providers')) {
  testTTSProviders().catch(console.error);
}