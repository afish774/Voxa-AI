/**
 * @route   GET /api/sports/live
 * @desc    Fetch and normalize live sports data for the frontend Spatial Card
 * @access  Public
 */

export const getLiveMatches = async (req, res) => {
    try {
        // 1. Fetch data from your real 3rd-party Sports API
        // const response = await fetch('https://your-sports-api.com/matches');
        // const apiMatches = await response.json();

        // Example array representing raw API data
        // We added mock data here so your frontend can test the Upcoming & Live states!
        const apiMatches = [
            {
                id: "match_1",
                league: { name: "ipl" },
                status: "Scheduled",
                startTime: "19:30 IST",
                homeTeam: { name: "CSK", score: "-" },
                awayTeam: { name: "MI", score: "-" }
            },
            {
                id: "match_2",
                league: { name: "epl" },
                status: "Live",
                minute: 67,
                homeTeam: { name: "Barcelona", score: 2 },
                awayTeam: { name: "Real Madrid", score: 1 },
                goals: [
                    { team: "Barcelona", scorer: "Lewandowski", minute: 23 },
                    { team: "Barcelona", scorer: "Lewandowski", minute: 58 },
                    { team: "Real Madrid", scorer: "Bellingham", minute: 41 }
                ]
            }
        ];

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

                // Pass extra data if it exists (like goals or match time)
                goals: match.goals || [],
                matchSeconds: match.minute ? match.minute * 60 : null,

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