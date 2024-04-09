import { PointData } from './points';

const TEAM_WINS=''
const TEAM_LOSSES=''
const PLAYER_MINUTES=''
const PLAYER_ASSISTS=''
const PLAYER_POINTS=''

// yields multiple {recipient, model, context, amt}
interface DData {
  [key:string]:any;
}

interface GameEvent {
  home_team: DData;
  visitor_team: DData;
  [key: string]: any;
}

interface PlayerEvent {
  player: DData;
  game: DData;
  team: DData;
  [key: string]: any;
}

function make_team_did(full_name: string) {
   return `did:nba_team:${full_name.replace(/\s+/g, '_')}`;
}

function make_player_did(first: string, last:string, id:number) {
   return `did:nba_player:${first.replace(/\s+/g, '_')}_${last.replace(/\s+/g, '_')}_${id}`
}

export function* generateGameResults(gameData: GameEvent[]): Generator<PointData> {
   for (const game of gameData) {
      const home_team_did = make_team_did(game.home_team.full_name)
      const away_team_did = make_team_did(game.visitor_team.full_name)
      const context = 'game date' + ':' + game.date
   
      if (game.home_team_score > game.visitor_team_score) {
          yield { recipient: home_team_did, model: TEAM_WINS, context: context, amt: 1}
          yield { recipient: away_team_did, model: TEAM_LOSSES, context: context, amt: 1}
      } else { // ties are not possible
          yield { recipient: away_team_did, model: TEAM_WINS, context: context, amt: 1}
          yield { recipient: home_team_did, model: TEAM_LOSSES, context: context, amt: 1}
      }
   }
}

export function *generatePlayerResults(statData: PlayerEvent[]): Generator<PointData> {
   for (const stats of statData) {
      const player_did = make_player_did(stats.player.first_name, stats.player.last_name, stats.player.id)
      const context = `game ${stats.game.id}: ${stats.game.date}`
      yield { recipient: player_did, model: PLAYER_MINUTES, context: context, amt: stats.min }
      yield { recipient: player_did, model: PLAYER_POINTS, context: context, amt: stats.pts }
      yield { recipient: player_did, model: PLAYER_ASSISTS, context: context, amt: stats.ast }
   }
}

/*
{
      "id": 14325883,
      "min": "38",
      "fgm": 10,
      "fga": 16,
      "fg_pct": 0.625,
      "fg3m": 0,
      "fg3a": 1,
      "fg3_pct": 0,
      "ftm": 11,
      "fta": 22,
      "ft_pct": 0.5,
      "oreb": 3,
      "dreb": 7,
      "reb": 10,
      "ast": 9,
      "stl": 2,
      "blk": 1,
      "turnover": 5,
      "pf": 1,
      "pts": 31,
      "player": {
        "id": 15,
        "first_name": "Giannis",
        "last_name": "Antetokounmpo",
        "position": "F",
        "height": "6-11",
        "weight": "243",
        "jersey_number": "34",
        "college": "Filathlitikos",
        "country": "Greece",
        "draft_year": 2013,
        "draft_round": 1,
        "draft_number": 15,
        "team_id": 17
      },
      "team": {
        "id": 17,
        "conference": "East",
        "division": "Central",
        "city": "Milwaukee",
        "name": "Bucks",
        "full_name": "Milwaukee Bucks",
        "abbreviation": "MIL"
      },
      "game": {
        "id": 1038184,
        "date": "2024-01-20",
        "season": 2023,
        "status": "Final",
        "period": 4,
        "time": "Final",
        "postseason": false,
        "home_team_score": 135,
        "visitor_team_score": 141,
        "home_team_id": 9,
        "visitor_team_id": 17
      }
    },
*/


/*
[
    {
      "id": 1,
      "date": "2018-10-16",
      "season": 2018,
      "status": "Final",
      "period": 4,
      "time": " ",
      "postseason": false,
      "home_team_score": 105,
      "visitor_team_score": 87,
      "home_team": {
        "id": 2,
        "conference": "East",
        "division": "Atlantic",
        "city": "Boston",
        "name": "Celtics",
        "full_name": "Boston Celtics",
        "abbreviation": "BOS"
      },
      "visitor_team": {
        "id": 23,
        "conference": "East",
        "division": "Atlantic",
        "city": "Philadelphia",
        "name": "76ers",
        "full_name": "Philadelphia 76ers",
        "abbreviation": "PHI"
      }
    },
*/
