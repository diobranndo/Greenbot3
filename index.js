const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.render('index', { status: 'Greenbot API está funcionando!' });
});

async function fetchGames() {
  try {
    const response = await axios.get(`https://api-futebol.com.br/v1/competitions/10/matches`, {
      headers: { 'Authorization': `Bearer ${process.env.API_KEY}` }
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
      headers: { 'Authorization': `Bearer ${process.env.API_KEY}` }
    });
    return response.data.slice(0, 10);
  } catch (error) {
    console.error('Erro ao buscar estatísticas do time:', error);
    return [];
  }
}

app.get('/recommendations', async (req, res) => {
  const games = await fetchGames();
  const recommendations = [];

  for (const game of games) {
    const homeStats = await fetchTeamStats(game.home_team.id);
    const awayStats = await fetchTeamStats(game.away_team.id);

    const homeAvgGoals = homeStats.reduce((acc, m) => acc + (m.home_score || 0), 0) / homeStats.length;
    const awayAvgGoals = awayStats.reduce((acc, m) => acc + (m.away_score || 0), 0) / awayStats.length;

    if (homeAvgGoals + awayAvgGoals > 2.5) {
      recommendations.push({
        partida: `${game.home_team.name} vs ${game.away_team.name}`,
        aposta: 'Mais de 2.5 gols'
      });
    }
  }

  res.render('recommendations', { recommendations });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});