/**
 * @route   GET /api/sports/live
 * @desc    Fetch and normalize live sports data for the frontend Spatial Card
 * @access  Public
 */

const getMatchData = async (req, res) => {
    try {
        // 1. Fetch data from your real 3rd-party Sports API
        // const response = await fetch('https://your-sports-api.com/matches');
        // const apiMatches = await response.json();

        // Example array representing raw API data
        const apiMatches = [/* ... your raw data ... */];

        const normalizedMatches = apiMatches.map(match => {

            // Determine the state based on the API's status strings
            const isFinished = match.status === 'Ended' || match.status === 'Finished';
            const isUpcoming = match.status === 'Scheduled' || match.status === 'Not Started';
            const isLive = !isFinished && !isUpcoming;

            return {
                id: match.id,
                league: match.league.name,
                isLive: isLive, // The magic boolean

                // Map teams
                teamA: {
                    name: match.homeTeam.name,
                    score: isUpcoming ? "-" : match.homeTeam.score
                },
                teamB: {
                    name: match.awayTeam.name,
                    score: isUpcoming ? "-" : match.awayTeam.score
                },

                // Dynamic Status Mapping
                status: isFinished ? "Full Time"
                    : isUpcoming ? `Starts at ${match.startTime}`
                        : `${match.minute}' - Live`
            };
        });

        return res.status(200).json({
            success: true,
            data: normalizedMatches
        });

    } catch (error) {
        console.error("API Error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch sports data" });
    }
};


module.exports = {
    getLiveMatches
};