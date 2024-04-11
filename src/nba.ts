import { PointData } from './points';

// the aggregators
const TEAM_WINS='kjzl6hvfrbw6c9skiblzj0w8xpyxf13lv7wthbhcmk9lprrnll8n6cg11d0ja7h'
const TEAM_LOSSES='kjzl6hvfrbw6c5vw1ysoj2g3v623dxdca0q4i0hxgsuwfm7i18dx3h4b4idi91o'
const PLAYER_MINUTES='kjzl6hvfrbw6caqg3n11v5v87ghz2h3enkvli7v1l2avfl3xbxuxe20gdwivxtc'
const PLAYER_ASSISTS='kjzl6hvfrbw6c5nuugjh10309fcxjpgmb4zwghm8byjcb3gyrq3k2agdrs3jk82'
const PLAYER_POINTS='kjzl6hvfrbw6c7aw39l8ww4042nedgby2aceqte29qls5n6j8cn14xsa16qi41o'

// the allocators that enforce one allocation event per game+team/player
const GAME_OUTCOME = 'kjzl6hvfrbw6c7h7n6p4xapmgjhmeg1feo1r4cg0q2armvdkcvqdkojf9zsumda'
const PLAYER_OUTCOME = 'kjzl6hvfrbw6c5e0mi4c3g9rxnkkamkikhil2ywmm9ydgiht0lte3lbulkevhlb'

// Interfaces describing the input data from the API
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

      

      const base = { amt: 1, allocationModel: GAME_OUTCOME, 
                     allocationFields: ['gameDate'],
                     allocationData:  { gameDate: game.date + ' 00:00:00', points: 1}
                   } 
      if (game.home_team_score > game.visitor_team_score) {
          yield { ...base, recipient: home_team_did, model: TEAM_WINS, 
                  allocationData: { ...base.allocationData, outcome: "win"}}
          yield { ...base, recipient: away_team_did, model: TEAM_LOSSES, 
                  allocationData: { ...base.allocationData, outcome: "loss"}}
      } else { // ties are not possible
          yield { ...base, recipient: away_team_did, model: TEAM_WINS,
                  allocationData: { ...base.allocationData, outcome: "win"}}
          yield { ...base, recipient: home_team_did, model: TEAM_LOSSES,
                  allocationData: { ...base.allocationData, outcome: "loss"}}
      }
   }
}

export function *generatePlayerResults(statData: PlayerEvent[]): Generator<PointData> {
   for (const stats of statData) {
      const player_did = make_player_did(stats.player.first_name, stats.player.last_name, stats.player.id)
      // we record all the data in the allocation record as well as adding it up
      const base = { allocationModel: PLAYER_OUTCOME, 
                     allocationFields: ['gameDate', 'statField'],
                     allocationData: { 'gameDate': stats.game.date + ' 00:00:00'} }

      yield { ...base, recipient: player_did, model: PLAYER_MINUTES, amt: parseInt(stats.min),
              allocationData: { ...base.allocationData, points: parseInt(stats.min), statField: 'minutes' }}
      yield { ...base, recipient: player_did, model: PLAYER_POINTS, amt: parseInt(stats.pts),
              allocationData: { ...base.allocationData, points: parseInt(stats.pts), statField: 'points_scored' }}
      yield { ...base, recipient: player_did, model: PLAYER_ASSISTS, amt: parseInt(stats.ast),
              allocationData: { ...base.allocationData, points: parseInt(stats.ast), statField: 'assists' }} 
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
