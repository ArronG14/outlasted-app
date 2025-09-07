// Test file for live scores integration
import { LiveScoreService } from './liveScoreService';

export async function testLiveScores() {
  try {
    console.log('Testing live scores integration...');
    
    // Test fetching live scores
    const liveScores = await LiveScoreService.fetchLiveScores();
    console.log('Live scores fetched:', liveScores.length, 'fixtures');
    
    // Test getting gameweek results
    const gameweekResults = await LiveScoreService.getGameweekResults(4);
    console.log('Gameweek 4 results:', gameweekResults);
    
    // Test checking if gameweek is finished
    const isFinished = await LiveScoreService.isGameweekFinished(4);
    console.log('Gameweek 4 finished:', isFinished);
    
    return {
      success: true,
      liveScoresCount: liveScores.length,
      gameweekResults,
      isFinished
    };
  } catch (error) {
    console.error('Live scores test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Export for use in browser console
(window as any).testLiveScores = testLiveScores;
