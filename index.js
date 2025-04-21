const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Greenbot API está funcionando!');
});

async function fetchGames() {
  try {
    const response = await axios.get(`https://api-futebol.com.br/v1/competitions/10/matches`, {
      headers: {
        'Authorization': `Bearer ${process.env.API_KEY}`
      }
    });

    return response.data.filter(match =>
      ['scheduled', 'in_progress'].includes(match.status)
    );
  } catch (error) {
    console.error('Erro ao buscar jogos:', error);
    return [];
  }
}

async function fetchTeamStats(teamId) {
  try {
    const response = await axios.get(`https://api-futebol.com.br/v1/teams/${teamId}/matches`, {
      headers: {
        'Authorization': `Bearer ${process.env.API_KEY}`
      }
    });
    return response.data.slice(0, 10);
  } catch (error) {
    console.error('Erro ao buscar estatísticas do time:', error);
    return [];
  }
}

app.get('/recommendations', async (req, res) => {
  const games = await fetchGames();

  if (!games || games.length === 0) {
    return res.status(404).json({ message: 'Nenhum jogo encontrado.' });
  }

  const recommendations = [];

  for (const game of games) {
    const homeTeamId = game.home_team.id;
    const awayTeamId = game.away_team.id;

    const homeStats = await fetchTeamStats(homeTeamId);
    const awayStats = await fetchTeamStats(awayTeamId);

    const homeAvgGoals = homeStats.reduce((acc, match) => acc + (match.home_score || 0), 0) / homeStats.length;
    const awayAvgGoals = awayStats.reduce((acc, match) => acc + (match.away_score || 0), 0) / awayStats.length;

    if (homeAvgGoals + awayAvgGoals > 2.5) {
      recommendations.push({
        partida: `${game.home_team.name} vs ${game.away_team.name}`,
        aposta: 'Mais de 2.5 gols'
      });
    }
  }

  res.json(recommendations);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});