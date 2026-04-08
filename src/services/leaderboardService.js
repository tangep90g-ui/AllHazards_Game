import { supabase } from './supabaseClient';

/**
 * LeaderboardService with Supabase Backend.
 * Includes data fetching, insertion, and realtime subscription support.
 */
export const LeaderboardService = {
  /**
   * Fetch the top 10 scores from Supabase.
   */
  async getTopScores() {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .order('score', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching scores:', error);
      throw error;
    }

    return {
      leaderboard: data.map((item, index) => ({
        rank: index + 1,
        name: item.name,
        score: item.score,
        date: new Date(item.created_at).toLocaleDateString('zh-TW', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        })
      }))
    };
  },

  /**
   * Submit a new score to Supabase.
   */
  async submitScore(name, score) {
    // 1. Insert the score
    const { data, error } = await supabase
      .from('leaderboard')
      .insert([{ name, score }])
      .select();

    if (error) {
      console.error('Error submitting score:', error);
      throw error;
    }

    // 2. Fetch the rank of this specific entry
    // (A simple query to count how many scores are higher than the current one)
    const { count, error: countError } = await supabase
      .from('leaderboard')
      .select('*', { count: 'exact', head: true })
      .gt('score', score);

    if (countError) {
      console.error('Error calculating rank:', countError);
      throw countError;
    }

    return {
      success: true,
      rank: (count || 0) + 1,
      id: data[0].id
    };
  },

  /**
   * Subscribe to leaderboard changes.
   * @param {Function} callback - Function called when a new score is added.
   * @returns {import('@supabase/supabase-js').RealtimeChannel}
   */
  subscribeToChanges(callback) {
    return supabase
      .channel('leaderboard-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'leaderboard' },
        (payload) => {
          console.log('Realtime update received:', payload);
          callback(payload.new);
        }
      )
      .subscribe();
  }
};
