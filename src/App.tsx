import { useState, useEffect } from 'react'
import './App.css'

interface Card {
  id: number;
  name: string;
  value: number;
  image: string;
}

interface HighScore {
  name: string;
  score: number;
  date: string;
}

type GameState = 'home' | 'playing' | 'leaderboard';

function App() {
  const [gameState, setGameState] = useState<GameState>('home');
  const [deck, setDeck] = useState<Card[]>([]);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [nextCard, setNextCard] = useState<Card | null>(null);
  const [score, setScore] = useState(0);
  const [cardsPlayed, setCardsPlayed] = useState(0);
  const [showNextCard, setShowNextCard] = useState(false);
  const [imageLoadError, setImageLoadError] = useState<string>('');
  const [resultMessage, setResultMessage] = useState<string>('');
  const [gameComplete, setGameComplete] = useState(false);
  const [cardHistory, setCardHistory] = useState<Card[]>([]);
  const [playerInitials, setPlayerInitials] = useState('');
  const [highScores, setHighScores] = useState<HighScore[]>([]);
  const [isHighScore, setIsHighScore] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHighScores();
  }, []);

  const fetchHighScores = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/scores');
      if (response.ok) {
        const scores = await response.json();
        setHighScores(scores);
      }
    } catch (error) {
      console.error('Error fetching scores:', error);
    } finally {
      setLoading(false);
    }
  };

  const startNewGame = () => {
    const cards: Card[] = Array.from({ length: 30 }, (_, i) => {
      const id = i + 1;
      return {
        id,
        name: getCardName(id),
        value: getCardValue(id),
        image: `card${id.toString().padStart(2, '0')}.jpg`
      };
    });
    
    shuffleDeck(cards);
    setGameState('playing');
  };

  const getCardValue = (id: number): number => {
    // Map each card to its correct power level (1-10)
    const powerLevels = [
      10, // THE SLUAGH
      9,  // THE ANCIENT
      8,  // THE SLIME
      7,  // TIZHERUK
      6,  // LANTERN MAN
      5,  // THE CREATURE
      4,  // EL COCO
      3,  // THE MONSTER
      2,  // GRINDYLOW
      1,  // JIANGSHI
      10, // UNDEAD KING
      9,  // THIN MAN
      8,  // JOROGUMO
      7,  // ACHERI
      6,  // COLD WALKER
      5,  // DETHRAAH
      4,  // COSMIC REAPER
      3,  // DULLAHAN
      2,  // PONTIANAK
      1,  // PHANTOM
      10, // GASHADOKURO
      9,  // MOTHMAN
      8,  // WEREWOLF
      7,  // MR. HYDE
      6,  // DEEP SPACE DEMON
      5,  // VAMPIRE
      4,  // ABYSSAL EMISSARIES
      3,  // FUTAKUCHI-ONNA
      2,  // WENDIGO
      1   // THE MALEVOLENT
    ];
    return powerLevels[id - 1];
  };

  const getCardName = (id: number): string => {
    const cardNames = [
      'THE SLUAGH', 'THE ANCIENT', 'THE SLIME', 'TIZERHUK', 'LANTERN MAN',
      'THE CREATURE', 'EL COCO', 'THE MONSTER', 'GRINDYLOW', 'JIANGSHI',
      'UNDEAD KING', 'THIN MAN', 'JOROGUMO', 'ACHERI', 'COLD WALKER',
      'DETHRAAH', 'COSMIC REAPER', 'DULLAHAN', 'PONTIANAK', 'PHANTOM',
      'GASHADOKURO', 'MOTHMAN', 'WEREWOLF', 'MR. HYDE', 'DEEP SPACE DEMON',
      'VAMPIRE', 'ABYSSAL EMISSARIES', 'FUTAKUCHI-ONNA', 'WENDIGO', 'THE MALEVOLENT'
    ];
    return cardNames[id - 1];
  };

  const shuffleDeck = (cards: Card[]) => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setDeck(shuffled.slice(2)); // Remove first two cards from deck
    setCurrentCard(shuffled[0]);
    setNextCard(shuffled[1]);
    setScore(0);
    setCardsPlayed(0);
    setShowNextCard(false);
    setImageLoadError('');
    setResultMessage('');
    setGameComplete(false);
    setCardHistory([]);
  };

  const getScoreForGuess = (currentValue: number, isHigher: boolean): number => {
    if (isHigher) {
      // Points for guessing higher based on current value
      const higherPoints = {
        1: 1,
        2: 2,
        3: 3,
        4: 4,
        5: 5,
        6: 6,
        7: 7,
        8: 8,
        9: 10
      };
      return higherPoints[currentValue as keyof typeof higherPoints] || 0;
    } else {
      // Points for guessing lower based on current value
      if (currentValue === 10) return 1;
      if (currentValue === 9) return 2;
      if (currentValue === 8) return 3;
      if (currentValue === 7) return 4;
      if (currentValue === 6) return 5;
      if (currentValue === 5) return 7;
      if (currentValue === 4) return 8;
      if (currentValue === 3) return 9;
      if (currentValue === 2) return 10;
      return 0;
    }
  };

  const checkHighScore = (newScore: number) => {
    if (highScores.length < 10) {
      setIsHighScore(true);
      return;
    }
    
    if (newScore > (highScores[highScores.length - 1]?.score || 0)) {
      setIsHighScore(true);
    }
  };

  const saveHighScore = async () => {
    if (playerInitials.length === 0) return;
    
    try {
      const response = await fetch('/api/scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: playerInitials.toUpperCase().padEnd(3, ' '),
          score
        })
      });

      if (response.ok) {
        await fetchHighScores();
        setIsHighScore(false);
        setGameState('leaderboard');
      } else {
        console.error('Failed to save score:', await response.text());
      }
    } catch (error) {
      console.error('Error saving score:', error);
    }
  };

  const moveToNextCards = () => {
    if (cardsPlayed >= 29) {
      // Game is complete after 29 guesses
      setGameComplete(true);
      checkHighScore(score);
      setResultMessage(`Game Complete! Final Score: ${score}`);
      return;
    }

    // Update history before moving to next card
    if (currentCard) {
      setCardHistory(prev => [currentCard, ...prev].slice(0, 5));
    }

    // Take the next card from the deck
    const nextCardFromDeck = deck[0];
    const newDeck = deck.slice(1);
    
    // Update the cards
    setCurrentCard(nextCard);
    setNextCard(nextCardFromDeck);
    setDeck(newDeck);
    setShowNextCard(false);
    setResultMessage('');
  };

  const handleGuess = (isHigher: boolean) => {
    if (!currentCard || !nextCard || showNextCard) return;

    setShowNextCard(true);
    setCardsPlayed(prev => prev + 1);
    
    if (currentCard.value === nextCard.value) {
      setResultMessage('Same power level! Moving to next card...');
      setTimeout(moveToNextCards, 1500);
      return;
    }

    const correct = isHigher 
      ? nextCard.value > currentCard.value
      : nextCard.value < currentCard.value;

    if (correct) {
      const pointsEarned = getScoreForGuess(currentCard.value, isHigher);
      setScore(prev => prev + pointsEarned);
      setResultMessage(`Correct! +${pointsEarned} points`);
    } else {
      setScore(prev => prev - 5);
      setResultMessage('Incorrect! -5 points');
    }

    if (cardsPlayed + 1 >= 29) {
      // This is the last guess, show game complete after the delay
      setTimeout(() => {
        setGameComplete(true);
        checkHighScore(score);
        setResultMessage(`Game Complete! Final Score: ${score}`);
      }, 1500);
    } else {
      setTimeout(moveToNextCards, 1500);
    }
  };

  const restartGame = () => {
    const cards: Card[] = Array.from({ length: 30 }, (_, i) => {
      const id = i + 1;
      return {
        id,
        name: getCardName(id),
        value: getCardValue(id),
        image: `card${id.toString().padStart(2, '0')}.jpg`
      };
    });
    shuffleDeck(cards);
    setPlayerInitials('');
    setIsHighScore(false);
    setGameState('playing');
  };

  const handleImageError = (cardType: string, error: any) => {
    console.error(`Error loading ${cardType} image:`, error);
    setImageLoadError(`Failed to load ${cardType} card image. Path: ${cardType === 'current' ? currentCard?.image : nextCard?.image}`);
  };

  const getPowerLabel = (value: number): string => {
    return `Power Level ${value}`;
  };

  const renderHome = () => (
    <div className="flex flex-col items-center gap-8">
      <h1 className="text-4xl md:text-6xl font-bold text-yellow-400 mb-4">Higher or Lower</h1>
      
      <p className="text-white text-lg md:text-xl mb-8 text-center max-w-md">
        Test your luck and strategy! Compare monster power levels and guess if the next card will be higher or lower.
        <br />
        Make riskier guesses for more points!
      </p>
      <div className="flex flex-col md:flex-row gap-4">
        <button
          onClick={startNewGame}
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg text-xl md:text-2xl w-full md:w-auto"
        >
          Play Game
        </button>
        <button
          onClick={() => setGameState('leaderboard')}
          className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-lg text-xl md:text-2xl w-full md:w-auto"
        >
          Leaderboard
        </button>
      </div>
    </div>
  );

  const renderLeaderboard = () => (
    <div className="flex flex-col items-center gap-8">
      <h1 className="text-4xl font-bold text-yellow-400 mb-4">Leaderboard</h1>
      {loading ? (
        <div className="text-gray-400 text-center text-xl">Loading...</div>
      ) : (
        <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
          <table className="w-full">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700">
                <th className="pb-2">Rank</th>
                <th className="pb-2">Name</th>
                <th className="pb-2">Score</th>
                <th className="pb-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {highScores.map((score, index) => (
                <tr key={index} className="text-center border-b border-gray-700 last:border-0">
                  <td className="py-2">{index + 1}</td>
                  <td className="py-2">{score.name}</td>
                  <td className="py-2">{score.score}</td>
                  <td className="py-2">{new Date(score.date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <button
        onClick={() => setGameState('home')}
        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-xl"
      >
        Back to Home
      </button>
    </div>
  );

  const Card = ({ card, showValue, small }: { card: Card | null, showValue: boolean, small?: boolean }) => {
    if (!card) return null;
    
    return (
      <div className="relative">
        <img 
          src={`/${card.image}`}
          alt={card.name}
          className={`${small ? 'w-24 h-36 md:w-32 md:h-48' : 'w-48 h-72 md:w-64 md:h-96'} object-cover rounded-lg`}
          onError={(e) => handleImageError(showValue ? 'current' : 'next', e)}
        />
        {showValue && (
          <div className="absolute bottom-1 left-1 bg-black bg-opacity-70 px-1 py-0.5 rounded text-white text-sm">
            <div className="text-xs">{card.name}</div>
            <div className="text-yellow-400 text-xs font-bold">{getPowerLabel(card.value)}</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 relative">
      <div className="absolute inset-0 before:content-[''] before:absolute before:inset-0 before:bg-[url('/bg.png')] before:bg-repeat before:bg-[length:300px_300px] before:grayscale"></div>
      <div className="bg-black bg-opacity-70 p-8 rounded-xl relative z-10 w-[95%] md:w-[1200px]">
        {gameState === 'home' && renderHome()}
        {gameState === 'leaderboard' && renderLeaderboard()}
        {gameState === 'playing' && (
          <>
            <h1 className="text-4xl font-bold text-yellow-400 mb-8 text-center">Higher or Lower</h1>
            
            <div className="flex flex-col md:flex-row justify-center items-center gap-4 md:gap-8 mb-8">
              <div className="text-green-400 text-2xl">Score: {score}</div>
              <div className="text-blue-400 text-2xl">Cards Remaining: {29 - cardsPlayed}</div>
            </div>

            <div className="flex flex-col items-center gap-8">
              {imageLoadError && (
                <div className="bg-red-600 text-white p-4 rounded mb-4">
                  {imageLoadError}
                </div>
              )}
              
              <div style={{ height: '24px', marginBottom: '8px' }}>
                {resultMessage && (
                  <div className={`text-xl font-bold ${
                    resultMessage.includes('Correct') ? 'text-green-400' : 
                    resultMessage.includes('Incorrect') ? 'text-red-400' : 
                    'text-yellow-400'
                  }`}>
                    {resultMessage}
                  </div>
                )}
              </div>
                
              <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-32">
                {currentCard && (
                  <div className="relative">
                    <img 
                      src={`/${currentCard.image}`}
                      alt={currentCard.name}
                      className="w-48 h-72 md:w-64 md:h-96 object-cover rounded-lg"
                      onError={(e) => handleImageError('current', e)}
                    />
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 px-2 py-1 rounded text-white">
                      <div>{currentCard.name}</div>
                      <div className="text-yellow-400 font-bold">{getPowerLabel(currentCard.value)}</div>
                    </div>
                  </div>
                )}
                  
                {nextCard && (
                  <div className="relative">
                    <img 
                      src={showNextCard ? `/${nextCard.image}` : '/bg.png'}
                      alt={showNextCard ? nextCard.name : 'Hidden Card'}
                      className="w-48 h-72 md:w-64 md:h-96 object-cover rounded-lg"
                      onError={(e) => handleImageError('next', e)}
                    />
                    {showNextCard && (
                      <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 px-2 py-1 rounded text-white">
                        <div>{nextCard.name}</div>
                        <div className="text-yellow-400 font-bold">{getPowerLabel(nextCard.value)}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col md:flex-row gap-4 md:gap-32 w-full max-w-md justify-center">
                {!gameComplete ? (
                  <>
                    <button
                      onClick={() => handleGuess(false)}
                      className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg text-xl font-bold w-full md:w-auto"
                      disabled={showNextCard || currentCard?.value === 1}
                    >
                      Lower
                    </button>
                    <button
                      onClick={() => handleGuess(true)}
                      className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg text-xl font-bold w-full md:w-auto"
                      disabled={showNextCard || currentCard?.value === 10}
                    >
                      Higher
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-4 w-full">
                    {isHighScore ? (
                      <div className="flex flex-col items-center gap-4">
                        <div className="text-yellow-400 text-2xl">New High Score!</div>
                        <div className="flex flex-col md:flex-row gap-4 items-center">
                          <input
                            type="text"
                            maxLength={3}
                            value={playerInitials}
                            onChange={(e) => setPlayerInitials(e.target.value.toUpperCase())}
                            className="bg-gray-800 text-white px-4 py-2 rounded-lg text-xl w-24 text-center"
                            placeholder="AAA"
                          />
                          <button
                            onClick={saveHighScore}
                            disabled={playerInitials.length === 0}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg text-xl disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Save Score
                          </button>
                        </div>
                        <div className="text-gray-400 text-sm">Enter 1-3 letters for your name</div>
                      </div>
                    ) : (
                      <div className="flex flex-col md:flex-row gap-4 w-full justify-center">
                        <button
                          onClick={() => setGameState('home')}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-xl w-full md:w-auto"
                        >
                          Back to Home
                        </button>
                        <button
                          onClick={() => setGameState('leaderboard')}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg text-xl w-full md:w-auto"
                        >
                          View Leaderboard
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-8 w-full overflow-x-auto">
                <h2 className="text-xl text-white mb-4">Previous Cards:</h2>
                <div className="flex gap-4 pb-2">
                  {cardHistory.map((card, index) => (
                    <div key={index} className="relative flex-shrink-0">
                      <img 
                        src={`/${card.image}`}
                        alt={card.name}
                        className="w-24 h-36 md:w-32 md:h-48 object-cover rounded-lg"
                      />
                      <div className="absolute bottom-1 left-1 bg-black bg-opacity-70 px-1 py-0.5 rounded text-white text-sm">
                        <div className="text-xs">{card.name}</div>
                        <div className="text-yellow-400 text-xs font-bold">{getPowerLabel(card.value)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App
